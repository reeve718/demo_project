import { ApiException } from '../common/http-exception';
import {
  BboxQueryDto,
  FEATURE_LIMIT_MAX,
  MAX_BBOX_AREA_SQ_DEG,
} from './dto/bbox-query.dto';
import { validateBbox } from './features.service';

function validBbox(): BboxQueryDto {
  return { minLon: 114.1, minLat: 22.2, maxLon: 114.3, maxLat: 22.4, limit: 200 };
}

describe('bbox validation', () => {
  it('accepts a small valid bbox', () => {
    expect(() => validateBbox(validBbox())).not.toThrow();
  });

  it('rejects minLon >= maxLon', () => {
    const b = validBbox();
    b.minLon = b.maxLon;
    try {
      validateBbox(b);
      fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ApiException);
      expect((e as ApiException).getStatus()).toBe(400);
    }
  });

  it('rejects minLat >= maxLat', () => {
    const b = validBbox();
    b.minLat = b.maxLat;
    expect(() => validateBbox(b)).toThrow(ApiException);
  });

  it('rejects out-of-range longitude', () => {
    const b = validBbox();
    b.maxLon = 200;
    expect(() => validateBbox(b)).toThrow();
  });

  it('rejects out-of-range latitude', () => {
    const b = validBbox();
    b.maxLat = 95;
    expect(() => validateBbox(b)).toThrow();
  });

  it(`rejects bbox area larger than ${MAX_BBOX_AREA_SQ_DEG} sq deg`, () => {
    const b = validBbox();
    b.minLon = 0;
    b.maxLon = 2;
    b.minLat = 0;
    b.maxLat = 1;
    expect(() => validateBbox(b)).toThrow(ApiException);
  });

  it(`rejects limit larger than ${FEATURE_LIMIT_MAX}`, () => {
    const b = validBbox();
    b.limit = FEATURE_LIMIT_MAX + 1;
    expect(() => validateBbox(b)).toThrow(ApiException);
  });
});