import DatashareClient from '@/api/DatashareClient'
import { actions, getters, mutations, state, datashare } from '@/store/modules/batchSearch'
import { jsonOk } from 'tests/unit/tests_utils'
import Vuex from 'vuex'
import Vue from 'vue'
import { IndexedDocument, letData } from 'tests/unit/es_utils'
import esConnectionHelper from 'tests/unit/specs/utils/esConnectionHelper'

Vue.use(Vuex)

describe('BatchSearch store', () => {
  esConnectionHelper()
  const es = esConnectionHelper.es
  let store

  beforeAll(() => {
    store = new Vuex.Store({ modules: { batchSearch: { namespaced: true, actions, getters, mutations, state } } })
  })

  beforeEach(() => {
    jest.spyOn(datashare, 'fetch')
    datashare.fetch.mockReturnValue(jsonOk())
  })

  afterEach(() => datashare.fetch.mockClear())

  describe('actions', () => {
    it('should submit the new batch search form with complete information', async () => {
      await store.dispatch('batchSearch/onSubmit', { name: 'name', published: false, csvFile: 'csvFile', description: 'description', project: 'project', fuzziness: 2, fileTypes: 'pdf' })

      const body = new FormData()
      body.append('name', 'name')
      body.append('description', 'description')
      body.append('csvFile', 'csvFile')
      body.append('published', false)
      body.append('fuzziness', 2)
      body.append('fileTypes', 'pdf')
      expect(datashare.fetch).toBeCalledTimes(2)
      expect(datashare.fetch).toBeCalledWith(DatashareClient.getFullUrl('/api/batch/search/project'), { method: 'POST', body })
      expect(datashare.fetch).toBeCalledWith(DatashareClient.getFullUrl('/api/batch/search'), {})
    })

    it('should retrieve a batch search according to its id', async () => {
      await letData(es).have(new IndexedDocument('12').withContentType('type_01')).commit()
      const batchSearch = [{ contentType: 'type_01', documentId: 12, rootId: 42 }]
      datashare.fetch.mockReturnValue(jsonOk(batchSearch))

      await store.dispatch('batchSearch/getBatchSearchResults', { batchId: 12 })

      expect(store.state.batchSearch.results).toHaveLength(1)
      expect(store.state.batchSearch.results[0].documentId).toBe(12)
      expect(store.state.batchSearch.results[0].rootId).toBe(42)
      expect(store.state.batchSearch.results[0].document).not.toBeNull()
    })

    it('should delete a specific batchSearch', async () => {
      store.state.batchSearch.batchSearches = ['batchSearch_01', 'batchSearch_02', 'batchSearch_03']

      await store.dispatch('batchSearch/deleteBatchSearch', { batchId: 'batchSearch_01' })

      expect(datashare.fetch).toBeCalledTimes(1)
      expect(datashare.fetch).toBeCalledWith(DatashareClient.getFullUrl('/api/batch/search/batchSearch_01'), { method: 'DELETE' })
      expect(store.state.batchSearch.batchSearches).toEqual(['batchSearch_02', 'batchSearch_03'])
    })

    it('should delete all batch searches', async () => {
      store.state.batchSearch.batchSearches = ['batchSearch_01', 'batchSearch_02', 'batchSearch_03']

      await store.dispatch('batchSearch/deleteBatchSearches')

      expect(datashare.fetch).toBeCalledTimes(1)
      expect(datashare.fetch).toBeCalledWith(DatashareClient.getFullUrl('/api/batch/search'), { method: 'DELETE' })
      expect(store.state.batchSearch.batchSearches).toEqual([])
    })
  })
})
