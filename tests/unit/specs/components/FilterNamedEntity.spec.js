import noop from 'lodash/noop'
import toLower from 'lodash/toLower'
import { createLocalVue, mount } from '@vue/test-utils'
import Murmur from '@icij/murmur'
import VueRouter from 'vue-router'

import { Core } from '@/core'
import esConnectionHelper from 'tests/unit/specs/utils/esConnectionHelper'
import FilterNamedEntity from '@/components/FilterNamedEntity'
import { IndexedDocument, letData } from 'tests/unit/es_utils'
import mixin from '@/mixins/filters'

jest.mock('@/api', () => {
  const { jsonResp } = require('tests/unit/tests_utils')
  return jest.fn(() => {
    return {
      deleteNamedEntitiesByMentionNorm: jest.fn().mockReturnValue(jsonResp()),
      getStarredDocuments: jest.fn().mockReturnValue(jsonResp())
    }
  })
})

const { localVue, i18n, store, wait } = Core.init(createLocalVue()).useAll()

describe('FilterNamedEntity.vue', () => {
  const index = toLower('FilterNamedEntity')
  esConnectionHelper(index)
  const es = esConnectionHelper.es
  let wrapper
  const id = 'document'

  beforeAll(() => {
    Murmur.config.set('manageDocuments', true)
    mixin.methods.watchedForUpdate = noop
    store.commit('search/index', index)
  })

  beforeEach(() => {
    wrapper = mount(FilterNamedEntity, { localVue, i18n, store, wait, propsData: { filter: store.getters['search/getFilter']({ name: 'namedEntityPerson' }) } })
    store.commit('search/setGlobalSearch', false)
  })

  afterEach(() => store.commit('search/reset'))

  afterAll(() => jest.unmock('@/api'))

  it('should display empty list', async () => {
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(0)
  })

  it('should display 1 named entity', async () => {
    await letData(es).have(new IndexedDocument(id, index)
      .withNer('person_01')).commit()

    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(1)
  })

  it('should display 2 named entities in one document', async () => {
    await letData(es).have(new IndexedDocument(id, index)
      .withNer('person_01')
      .withNer('person_02')).commit()

    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(2)
  })

  it('should display 1 named entity in 2 documents', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01', 2)
      .withNer('person_01', 25)).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withNer('person_01')).commit()

    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(1)
    expect(wrapper.findAll('.list-group-item .filter__items__item__count').at(0).text()).toEqual('2')
  })

  it('should display 3 named entities in 2 documents in correct order', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01', 2)).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withNer('person_02', 2)
      .withNer('person_02', 16)
      .withNer('person_02', 21)
      .withNer('person_01', 26)
      .withNer('person_03', 35)).commit()

    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(3)
    expect(wrapper.findAll('.list-group-item .filter__items__item .filter__items__item__label').at(0).text()).toEqual('person_01')
    expect(wrapper.findAll('.list-group-item .filter__items__item .filter__items__item__label').at(1).text()).toEqual('person_02')
    expect(wrapper.findAll('.list-group-item .filter__items__item .filter__items__item__label').at(2).text()).toEqual('person_03')
  })

  it('should not display the "Show more" button', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01', 2)).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withNer('person_02', 2)
      .withNer('person_02', 16)
      .withNer('person_02', 21)
      .withNer('person_01', 26)
      .withNer('person_03', 35)).commit()

    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.filter__items__display span')).toHaveLength(0)
  })

  it('should display the "Show more" button', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01', 1)
      .withNer('person_02', 1)
      .withNer('person_03', 1)
      .withNer('person_04', 1)
      .withNer('person_05', 1)
      .withNer('person_06', 1)
      .withNer('person_07', 1)
      .withNer('person_08', 1)
      .withNer('person_09', 1)).commit()

    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.filter__items__display > span')).toHaveLength(1)
    expect(wrapper.find('.filter__items__display > span').text()).toEqual('Show more')
  })

  it('should filter on named entity filter and return no items', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01')).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withNer('person_02')).commit()
    await letData(es).have(new IndexedDocument('document_03', index)
      .withNer('person_03')).commit()
    await letData(es).have(new IndexedDocument('document_04', index)
      .withNer('person_04')).commit()

    wrapper.vm.root.filterQuery = 'Windows'
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(0)
  })

  it('should filter on named entity filter and return all items', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01')).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withNer('person_02')).commit()
    await letData(es).have(new IndexedDocument('document_03', index)
      .withNer('person_03')).commit()
    await letData(es).have(new IndexedDocument('document_04', index)
      .withNer('person_04')).commit()

    wrapper.vm.root.filterQuery = 'person'
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(4)
  })

  it('should filter on named entity filter and return only 1 item', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01')).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withNer('person_02')).commit()
    await letData(es).have(new IndexedDocument('document_03', index)
      .withNer('person_03')).commit()
    await letData(es).have(new IndexedDocument('document_04', index)
      .withNer('person_04')).commit()

    wrapper.vm.root.filterQuery = 'person_01'
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(1)
  })

  describe('Deletion', () => {
    it('should display the "delete" button', async () => {
      await letData(es).have(new IndexedDocument(id, index)
        .withNer('person_01')).commit()

      await wrapper.vm.root.aggregate()

      expect(wrapper.findAll('.list-group-item .filter__items__item .filter__items__item__delete')).toHaveLength(1)
    })

    it('should emit an event filter::hide::named-entities on delete named entity', async () => {
      const mockCallback = jest.fn()
      wrapper.vm.$root.$on('filter::hide::named-entities', mockCallback)

      await wrapper.vm.deleteNamedEntitiesByMentionNorm('ner_01')

      expect(mockCallback.mock.calls).toHaveLength(1)
    })
  })

  it('should filter items according to the content type filter search', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withContentType('type_01')
      .withNer('person_01')).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withContentType('type_02')
      .withNer('person_02')).commit()

    store.commit('search/setFilterValue', { name: 'contentType', value: 'type_01' })
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(1)
  })

  it('should filter items according to the date filter search', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01')
      .withIndexingDate('2018-10-19T10:11:12.001Z')).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withNer('person_02')
      .withIndexingDate('2018-09-19T10:11:12.001Z')).commit()

    const value = [new Date('2018-09-01T00:00:00.000Z').getTime().toString()]
    store.commit('search/setFilterValue', { name: 'indexingDate', value })
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(1)
  })

  it('should filter items according to the content type reverse filter search', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withContentType('type_01')
      .withNer('person_01')).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withContentType('type_02')
      .withNer('person_02')).commit()
    await letData(es).have(new IndexedDocument('document_03', index)
      .withContentType('type_03')
      .withNer('person_03')).commit()

    store.commit('search/setFilterValue', { name: 'contentType', value: ['type_01'] })
    store.commit('search/toggleFilter', 'contentType')
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(2)
    expect(wrapper.findAll('.list-group-item .filter__items__item .filter__items__item__label').at(0).text()).toContain('person_02')
    expect(wrapper.findAll('.list-group-item .filter__items__item .filter__items__item__label').at(1).text()).toContain('person_03')
  })

  it('should display the named entities containing the query string, and those linked to documents containing the query string', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01')).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withContent('person_01')
      .withNer('person_02')).commit()
    await letData(es).have(new IndexedDocument('document_03', index)
      .withNer('person_03')).commit()

    store.commit('search/query', 'person_01')
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(2)
    expect(wrapper.findAll('.list-group-item .filter__items__item .filter__items__item__label').at(0).text()).toContain('person_01')
    expect(wrapper.findAll('.list-group-item .filter__items__item .filter__items__item__label').at(1).text()).toContain('person_02')
  })

  it('should filter items according to the named entity filter search', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01')).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withNer('person_02')).commit()
    await letData(es).have(new IndexedDocument('document_03', index)
      .withNer('person_03')).commit()

    store.commit('search/setFilterValue', { name: 'namedEntityPerson', value: ['person_01'] })
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(1)
    expect(wrapper.findAll('.list-group-item .filter__items__item').at(0).text()).toContain('person_01')
  })

  it('should display the only namedEntityPerson selected', async () => {
    await letData(es).have(new IndexedDocument('doc_01', index)
      .withNer('person_01')
      .withNer('person_02')
      .withNer('person_03')
      .withNer('organization_01', 1, 'ORGANIZATION')
      .withNer('organization_02', 1, 'ORGANIZATION')
    ).commit()
    await letData(es).have(new IndexedDocument('doc_02', index)
      .withNer('person_03')
      .withNer('organization_03', 1, 'ORGANIZATION')
    ).commit()
    await letData(es).have(new IndexedDocument('doc_03', index)
      .withNer('person_02')
      .withNer('person_04')
      .withNer('organization_02', 1, 'ORGANIZATION')
      .withNer('organization_03', 1, 'ORGANIZATION')
      .withNer('organization_04', 1, 'ORGANIZATION')
    ).commit()

    store.commit('search/setFilterValue', { name: 'namedEntityPerson', value: ['person_02'] })
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(1)
    expect(wrapper.findAll('.list-group-item .filter__items__item').at(0).text()).toContain('person_02')
  })

  it('should filter items of namedEntityPerson according to the namedEntityOrganization selected', async () => {
    await letData(es).have(new IndexedDocument('doc_01', index)
      .withNer('person_01')
      .withNer('person_02')
      .withNer('person_03')
      .withNer('organization_01', 1, 'ORGANIZATION')
      .withNer('organization_02', 1, 'ORGANIZATION')
    ).commit()
    await letData(es).have(new IndexedDocument('doc_02', index)
      .withNer('person_03')
      .withNer('organization_03', 1, 'ORGANIZATION')
    ).commit()
    await letData(es).have(new IndexedDocument('doc_03', index)
      .withNer('person_02')
      .withNer('person_04')
      .withNer('organization_02', 1, 'ORGANIZATION')
      .withNer('organization_03', 1, 'ORGANIZATION')
      .withNer('organization_04', 1, 'ORGANIZATION')
    ).commit()

    store.commit('search/setFilterValue', { name: 'namedEntityOrganization', value: ['organization_03'] })
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(3)
    expect(wrapper.findAll('.list-group-item .filter__items__item').at(0).text()).toContain('person_02')
    expect(wrapper.findAll('.list-group-item .filter__items__item').at(1).text()).toContain('person_03')
    expect(wrapper.findAll('.list-group-item .filter__items__item').at(2).text()).toContain('person_04')
  })

  it('should prepend a selected and inverted Named Entity in the items, and show it in the list of filter items', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('anne')).commit()
    await letData(es).have(new IndexedDocument('document_02', index)
      .withNer('bruno')).commit()

    store.commit('search/setFilterValue', { name: 'namedEntityPerson', value: ['anne'] })
    store.commit('search/toggleFilter', 'namedEntityPerson')
    store.commit('search/setGlobalSearch', true)
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(2)
    expect(wrapper.findAll('.list-group-item .filter__items__item').at(0).find('.filter__items__item__label').text()).toBe('anne')
    expect(wrapper.findAll('.list-group-item .filter__items__item').at(1).find('.filter__items__item__label').text()).toBe('bruno')
  })

  it('should filter filters items on 2 named entities from different categories', async () => {
    await letData(es).have(new IndexedDocument(id, index)
      .withNer('person_01')
      .withNer('person_02')
      .withNer('organization_01', 1, 'ORGANIZATION')
      .withNer('organization_02', 1, 'ORGANIZATION')
      .withNer('location_01', 1, 'LOCATION')
      .withNer('location_02', 1, 'LOCATION')
    ).commit()

    store.commit('search/setFilterValue', { name: 'namedEntityPerson', value: ['person_01'] })
    store.commit('search/setFilterValue', { name: 'namedEntityOrganization', value: ['organization_01'] })
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(1)
  })

  it('should display the correct number of occurrences if named entity filter is inverted', async () => {
    await letData(es).have(new IndexedDocument('document_01', index)
      .withNer('person_01')
      .withNer('organization_01', 1, 'ORGANIZATION')
    ).commit()

    await letData(es).have(new IndexedDocument('document_02', index)
      .withNer('person_02')
      .withNer('organization_02', 1, 'ORGANIZATION')
    ).commit()

    store.commit('search/setFilterValue', { name: 'namedEntityOrganization', value: ['organization_01'] })
    store.commit('search/toggleFilter', 'namedEntityOrganization')
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(1)
    expect(wrapper.findAll('.list-group-item .filter__items__item__count').at(0).text()).toContain('1')
  })

  it('should display an "All" item on top of others items, and this item should be active by default', async () => {
    await letData(es).have(new IndexedDocument(id, index)
      .withContent('person_01')
      .withNer('person_01')).commit()

    await wrapper.vm.root.aggregate()
    await store.dispatch('search/query', '*')

    expect(wrapper.findAll('.filter__items__all')).toHaveLength(1)
    expect(wrapper.find('.filter__items__all .custom-control-input').element.checked).toBeTruthy()
    expect(wrapper.findAll('.filter__items__all .filter__items__item__label').at(0).text()).toEqual('All')
  })

  it('should load and checked the filter values stored in store', async () => {
    await letData(es).have(new IndexedDocument(id, index).withNer('person_01')).commit()
    store.commit('search/setFilterValue', { name: 'namedEntityPerson', value: ['person_01'] })

    wrapper = mount(FilterNamedEntity, { localVue, i18n, store, wait, propsData: { filter: store.getters['search/getFilter']({ name: 'namedEntityPerson' }) } })
    await wrapper.vm.root.aggregate()

    expect(wrapper.findAll('.list-group-item .filter__items__item')).toHaveLength(1)
    expect(wrapper.findAll('.list-group-item .filter__items__item .filter__items__item__label').at(0).text()).toEqual('person_01')
    expect(wrapper.findAll('.list-group-item .filter__items__item input').at(0).element.checked).toBeTruthy()
  })

  it('should select the "All" item by default if nothing is selected', async () => {
    await letData(es).have(new IndexedDocument(id, index).withNer('person_01')).commit()

    store.commit('search/setFilterValue', { name: 'namedEntityPerson', value: ['person_01'] })
    wrapper = mount(FilterNamedEntity, { localVue, i18n, wait, router: new VueRouter(), store, propsData: { filter: store.getters['search/getFilter']({ name: 'namedEntityPerson' }) } })

    await wrapper.vm.root.aggregate()
    await wrapper.findAll('.list-group-item .filter__items__item input').at(0).trigger('click')

    expect(wrapper.findAll('.filter__items__all input').at(0).element.checked).toBeTruthy()
  })
})
