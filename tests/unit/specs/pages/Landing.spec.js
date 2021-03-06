import Murmur from '@icij/murmur'
import { createLocalVue, shallowMount } from '@vue/test-utils'

import { Core } from '@/core'
import Landing from '@/pages/Landing'

const { i18n, localVue, store } = Core.init(createLocalVue()).useAll()

describe('Landing.vue', () => {
  let wrapper

  beforeEach(() => {
    Murmur.config.merge({ multipleProjects: true })
    Murmur.config.merge({ datashare_projects: ['project'] })
    wrapper = shallowMount(Landing, { i18n, localVue, store })
  })

  it('should display a search bar', () => {
    expect(wrapper.find('.landing__form__search-bar').exists()).toBeTruthy()
  })

  it('should display project cards', () => {
    expect(wrapper.find('.landing__form__projects').exists()).toBeTruthy()
  })
})
