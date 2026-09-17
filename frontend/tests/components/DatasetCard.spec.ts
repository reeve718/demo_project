import { mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter } from 'vue-router';

import DatasetCard from '../../src/components/datasets/DatasetCard.vue';
import type { DatasetSummary } from '../../src/types';

const sample: DatasetSummary = {
  id: '1',
  slug: 'flood-risk-zones',
  title: 'Flood Risk Zones',
  description: 'Synthetic polygon dataset for demo.',
  theme: 'Environment',
  publisher: 'Demo GIS Team',
  license: 'Synthetic',
  updatedAt: '2026-09-01T00:00:00.000Z',
  tags: ['flood', 'risk'],
  bbox: [114.1, 22.2, 114.3, 22.4],
};

function mountWithRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/datasets/:slug', component: { template: '<div />' } },
    ],
  });
  return mount(DatasetCard, { props: { dataset: sample }, global: { plugins: [router] } });
}

describe('DatasetCard', () => {
  it('renders title, theme, and tags', () => {
    const wrapper = mountWithRouter();
    expect(wrapper.text()).toContain('Flood Risk Zones');
    expect(wrapper.text()).toContain('Environment');
    expect(wrapper.text()).toContain('flood');
    expect(wrapper.text()).toContain('risk');
  });

  it('links to the dataset detail page', () => {
    const wrapper = mountWithRouter();
    const link = wrapper.find('a');
    expect(link.attributes('href')).toContain('/datasets/flood-risk-zones');
  });
});