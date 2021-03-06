import axios from 'axios'
import toLower from 'lodash/toLower'
import Vue from 'vue'
import Vuex from 'vuex'

import Api from '@/api'
import { actions, getters, mutations, state } from '@/store/modules/batchSearch'
import { IndexedDocument, letData } from 'tests/unit/es_utils'
import esConnectionHelper from 'tests/unit/specs/utils/esConnectionHelper'

Vue.use(Vuex)

jest.mock('axios', () => {
  return {
    request: jest.fn().mockResolvedValue({ data: {} })
  }
})

describe('BatchSearchStore', () => {
  const index = toLower('BatchSearchStore')
  esConnectionHelper(index)
  const es = esConnectionHelper.es
  let store

  beforeAll(() => {
    store = new Vuex.Store({ modules: { batchSearch: { namespaced: true, actions, getters, mutations, state } } })
  })

  afterEach(() => axios.request.mockClear())

  afterAll(() => jest.unmock('axios'))

  describe('actions', () => {
    it('should submit the new batchSearch form with complete information', async () => {
      await store.dispatch('batchSearch/onSubmit', { name: 'name', csvFile: 'csvFile', description: 'description', project: 'project', phraseMatch: false, fuzziness: 2, fileTypes: [{ mime: 'pdf' }, { mime: 'csv' }], paths: ['/a/path/to/home', '/another/path'], published: false })
      const data = new FormData()
      data.append('name', 'name')
      data.append('csvFile', 'csvFile')
      data.append('description', 'description')
      data.append('phrase_matches', false)
      data.append('fuzziness', 2)
      data.append('fileTypes', 'pdf')
      data.append('fileTypes', 'csv')
      data.append('paths', '/a/path/to/home')
      data.append('paths', '/another/path')
      data.append('published', false)
      expect(axios.request).toBeCalledTimes(2)
      expect(axios.request).toBeCalledWith(expect.objectContaining({
        url: Api.getFullUrl('/api/batch/search/project'),
        method: 'POST',
        data
      }))
      expect(axios.request).toBeCalledWith({ url: Api.getFullUrl('/api/batch/search') })
    })

    it('should retrieve a batchSearch according to its id', async () => {
      await letData(es).have(new IndexedDocument('document', index).withContentType('type_01')).commit()
      const batchSearch = [{ contentType: 'type_01', documentId: 12, rootId: 42 }]
      axios.request.mockReturnValue({ data: batchSearch })

      await store.dispatch('batchSearch/getBatchSearchResults', { batchId: 12 })

      expect(store.state.batchSearch.results).toHaveLength(1)
      expect(store.state.batchSearch.results[0].documentId).toBe(12)
      expect(store.state.batchSearch.results[0].rootId).toBe(42)
      expect(store.state.batchSearch.results[0].document).not.toBeNull()
    })

    it('should delete a specific batchSearch', async () => {
      store.state.batchSearch.batchSearches = ['batchSearch_01', 'batchSearch_02', 'batchSearch_03']

      await store.dispatch('batchSearch/deleteBatchSearch', { batchId: 'batchSearch_01' })

      expect(axios.request).toBeCalledTimes(1)
      expect(axios.request).toBeCalledWith(expect.objectContaining({
        url: Api.getFullUrl('/api/batch/search/batchSearch_01'),
        method: 'DELETE'
      }))
      expect(store.state.batchSearch.batchSearches).toEqual(['batchSearch_02', 'batchSearch_03'])
    })

    it('should delete all the batchSearches', async () => {
      store.state.batchSearch.batchSearches = ['batchSearch_01', 'batchSearch_02', 'batchSearch_03']

      await store.dispatch('batchSearch/deleteBatchSearches')

      expect(axios.request).toBeCalledTimes(1)
      expect(axios.request).toBeCalledWith(expect.objectContaining({
        url: Api.getFullUrl('/api/batch/search'),
        method: 'DELETE'
      }))
      expect(store.state.batchSearch.batchSearches).toEqual([])
    })
  })
})
