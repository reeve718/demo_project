import { mount } from '@vue/test-utils';

import FeatureDetails from '../../src/components/map/FeatureDetails.vue';
import type { GeoFeature } from '../../src/types';

const baseFeature: GeoFeature = {
  type: 'Feature',
  id: 'f-1',
  geometry: { type: 'Point', coordinates: [114.18, 22.32] },
  properties: {
    name: 'Synthetic Station',
    station_id: 'FS-001',
    status: 'active',
  },
};

describe('FeatureDetails', () => {
  it('renders all provided properties', () => {
    const wrapper = mount(FeatureDetails, { props: { feature: baseFeature } });
    expect(wrapper.text()).toContain('Synthetic Station');
    expect(wrapper.text()).toContain('FS-001');
    expect(wrapper.text()).toContain('active');
    expect(wrapper.text()).toContain('Point');
  });

  it('renders safely when properties contain null or undefined', () => {
    const wrapper = mount(FeatureDetails, {
      props: {
        feature: {
          ...baseFeature,
          properties: {
            name: null as unknown as string,
            status: undefined,
            note: 'some note',
          },
        },
      },
    });
    // null / undefined values render as an em dash placeholder
    expect(wrapper.text()).toContain('—');
    expect(wrapper.text()).toContain('some note');
  });

  it('emits close and zoom events', async () => {
    const wrapper = mount(FeatureDetails, { props: { feature: baseFeature } });
    await wrapper.find('button[aria-label="Close feature details"]').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
    await wrapper.find('.zoom-btn').trigger('click');
    expect(wrapper.emitted('zoom')).toBeTruthy();
  });

  it('renders empty state when no feature is selected', () => {
    const wrapper = mount(FeatureDetails, { props: { feature: null } });
    expect(wrapper.text()).toContain('No attributes available');
  });

  it('renders the dataset title as a layer tag when provided', () => {
    const wrapper = mount(FeatureDetails, {
      props: { feature: baseFeature, datasetTitle: 'Hong Kong Fire Stations' },
    });
    expect(wrapper.text()).toContain('Hong Kong Fire Stations');
    // Geometry type tag is replaced by the dataset tag.
    expect(wrapper.text()).not.toContain('Point');
  });
});