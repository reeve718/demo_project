import { mount } from '@vue/test-utils';

import EmptyState from '../../src/components/common/EmptyState.vue';

describe('EmptyState', () => {
  it('renders a user-friendly message', () => {
    const wrapper = mount(EmptyState, {
      props: { title: 'Nothing here', message: 'Try later.' },
    });
    expect(wrapper.text()).toContain('Nothing here');
    expect(wrapper.text()).toContain('Try later.');
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true);
  });

  it('uses defaults when props are not provided', () => {
    const wrapper = mount(EmptyState);
    expect(wrapper.text()).toContain('No results found');
  });
});