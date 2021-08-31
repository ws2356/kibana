/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

// This implementation:
// - does not include meta-fields
// - does not validate the schema against the index-pattern (e.g. nested fields)
// In the context of .mvt this is sufficient:
// - only fields from the response are packed in the tile (more efficient)
// - query-dsl submitted from the client, which was generated by the IndexPattern
// todo: Ideally, this should adapt/reuse from https://github.com/elastic/kibana/blob/52b42a81faa9dd5c102b9fbb9a645748c3623121/src/plugins/data/common/index_patterns/index_patterns/flatten_hit.ts#L26

// @ts-expect-error
import vtpbf from 'vt-pbf';
// @ts-expect-error
import geojsonvt from 'geojson-vt';
import { FeatureCollection, Polygon } from 'geojson';
import { ESBounds } from '../../common/geo_tile_utils';
import { getCentroidFeatures } from '../../common/get_centroid_features';
import { createExtentFilter } from '../../common/elasticsearch_util';

export function flattenHit(
  geometryField: string,
  hit: Record<string, unknown>
): Record<string, any> {
  const flat: Record<string, any> = {};
  if (hit) {
    flattenSource(flat, '', hit._source as Record<string, unknown>, geometryField);
    if (hit.fields) {
      flattenFields(flat, hit.fields as Array<Record<string, unknown>>);
    }

    // Attach meta fields
    flat._index = hit._index;
    flat._id = hit._id;
  }
  return flat;
}

function flattenSource(
  accum: Record<string, any>,
  path: string,
  properties: Record<string, unknown> = {},
  geometryField: string
): Record<string, any> {
  accum = accum || {};
  for (const key in properties) {
    if (properties.hasOwnProperty(key)) {
      const newKey = path ? path + '.' + key : key;
      let value;
      if (geometryField === newKey) {
        value = properties[key]; // do not deep-copy the geometry
      } else if (properties[key] !== null && typeof value === 'object' && !Array.isArray(value)) {
        value = flattenSource(
          accum,
          newKey,
          properties[key] as Record<string, unknown>,
          geometryField
        );
      } else {
        value = properties[key];
      }
      accum[newKey] = value;
    }
  }
  return accum;
}

function flattenFields(accum: Record<string, any> = {}, fields: Array<Record<string, unknown>>) {
  accum = accum || {};
  for (const key in fields) {
    if (fields.hasOwnProperty(key)) {
      const value = fields[key];
      if (Array.isArray(value)) {
        accum[key] = value[0];
      } else {
        accum[key] = value;
      }
    }
  }
}

export function getTileSpatialFilter(geometryFieldName: string, tileBounds: ESBounds): unknown {
  const tileExtent = {
    minLon: tileBounds.top_left.lon,
    minLat: tileBounds.bottom_right.lat,
    maxLon: tileBounds.bottom_right.lon,
    maxLat: tileBounds.top_left.lat,
  };
  const tileExtentFilter = createExtentFilter(tileExtent, [geometryFieldName]);
  return tileExtentFilter.query;
}

export function esBboxToGeoJsonPolygon(esBounds: ESBounds, tileBounds: ESBounds): Polygon {
  // Intersecting geo_shapes may push bounding box outside of tile so need to clamp to tile bounds.
  let minLon = Math.max(esBounds.top_left.lon, tileBounds.top_left.lon);
  const maxLon = Math.min(esBounds.bottom_right.lon, tileBounds.bottom_right.lon);
  minLon = minLon > maxLon ? minLon - 360 : minLon; // fixes an ES bbox to straddle dateline
  const minLat = Math.max(esBounds.bottom_right.lat, tileBounds.bottom_right.lat);
  const maxLat = Math.min(esBounds.top_left.lat, tileBounds.top_left.lat);

  return {
    type: 'Polygon',
    coordinates: [
      [
        [minLon, minLat],
        [minLon, maxLat],
        [maxLon, maxLat],
        [maxLon, minLat],
        [minLon, minLat],
      ],
    ],
  };
}

export function createMvtTile(
  featureCollection: FeatureCollection,
  layerName: string,
  z: number,
  x: number,
  y: number
): Buffer | null {
  featureCollection.features.push(...getCentroidFeatures(featureCollection));
  const tileIndex = geojsonvt(featureCollection, {
    maxZoom: 24, // max zoom to preserve detail on; can't be higher than 24
    tolerance: 3, // simplification tolerance (higher means simpler)
    extent: 4096, // tile extent (both width and height)
    buffer: 64, // tile buffer on each side
    debug: 0, // logging level (0 to disable, 1 or 2)
    lineMetrics: false, // whether to enable line metrics tracking for LineString/MultiLineString features
    promoteId: null, // name of a feature property to promote to feature.id. Cannot be used with `generateId`
    generateId: false, // whether to generate feature ids. Cannot be used with `promoteId`
    indexMaxZoom: 5, // max zoom in the initial tile index
    indexMaxPoints: 100000, // max number of points per tile in the index
  });
  const tile = tileIndex.getTile(z, x, y);

  if (tile) {
    const pbf = vtpbf.fromGeojsonVt({ [layerName]: tile }, { version: 2 });
    return Buffer.from(pbf);
  } else {
    return null;
  }
}
