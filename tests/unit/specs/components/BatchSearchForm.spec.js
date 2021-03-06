import toLower from 'lodash/toLower'
import Murmur from '@icij/murmur'
import { createLocalVue, mount, shallowMount } from '@vue/test-utils'
import Vuex from 'vuex'

import BatchSearchForm from '@/components/BatchSearchForm'
import { Core } from '@/core'
import { IndexedDocument, letData } from 'tests/unit/es_utils'
import esConnectionHelper from 'tests/unit/specs/utils/esConnectionHelper'

const { i18n, localVue } = Core.init(createLocalVue()).useAll()

jest.mock('lodash/throttle', () => jest.fn(fn => fn))

describe('BatchSearchForm.vue', () => {
  const project = toLower('BatchSearchForm')
  const anotherProject = toLower('anotherProject')
  esConnectionHelper([project, anotherProject])
  const es = esConnectionHelper.es
  let wrapper
  const state = { batchSearches: [] }
  const actions = { onSubmit: jest.fn(), getBatchSearches: jest.fn() }
  const store = new Vuex.Store({ modules: { batchSearch: { namespaced: true, state, actions }, search: { namespaced: true, actions: { queryFilter: jest.fn() } } } })

  beforeAll(() => Murmur.config.merge({ datashare_projects: [project], dataDir: '/root/project' }))

  beforeEach(() => {
    wrapper = shallowMount(BatchSearchForm, { i18n, localVue, store })
  })

  afterAll(() => jest.unmock('lodash/throttle'))

  it('should call the store action on form submit and reset the form', async () => {
    jest.spyOn(wrapper.vm, 'resetForm')

    await wrapper.vm.onSubmit()

    expect(actions.onSubmit).toBeCalled()
    expect(wrapper.vm.resetForm).toBeCalled()
  })

  it('should display a form with 8 fields: name, csvFile, description, phraseMatch, fuzziness, fileTypes, paths and published', () => {
    expect(wrapper.findAll('.card-body b-form-group-stub')).toHaveLength(7)
    expect(wrapper.findAll('.card-body b-form-input-stub')).toHaveLength(4)
    expect(wrapper.findAll('.card-body b-form-file-stub')).toHaveLength(1)
    expect(wrapper.findAll('.card-body b-form-textarea-stub')).toHaveLength(1)
    expect(wrapper.findAll('.card-body b-form-checkbox-stub')).toHaveLength(1)
  })

  it('should reset the form', () => {
    wrapper.vm.$set(wrapper.vm, 'csvFile', new File(['File content'], 'test_file.csv', { type: 'text/csv' }))
    wrapper.vm.$set(wrapper.vm, 'description', 'This is a description')
    wrapper.vm.$set(wrapper.vm, 'fileType', 'PDF')
    wrapper.vm.$set(wrapper.vm, 'fileTypes', [{ label: 'PDF' }])
    wrapper.vm.$set(wrapper.vm, 'fuzziness', 2)
    wrapper.vm.$set(wrapper.vm, 'name', 'Example')
    wrapper.vm.$set(wrapper.vm, 'path', 'path test')
    wrapper.vm.$set(wrapper.vm, 'paths', ['This', 'is', 'a', 'multiple', 'paths'])
    wrapper.vm.$set(wrapper.vm, 'phraseMatch', false)
    wrapper.vm.$set(wrapper.vm, 'project', 'project-example')
    wrapper.vm.$set(wrapper.vm, 'published', false)
    wrapper.vm.$set(wrapper.vm, 'showAdvancedFilters', true)

    wrapper.vm.resetForm()

    expect(wrapper.vm.csvFile).toBeNull()
    expect(wrapper.vm.description).toBe('')
    expect(wrapper.vm.fileType).toBe('')
    expect(wrapper.vm.fileTypes).toEqual([])
    expect(wrapper.vm.fuzziness).toBe(0)
    expect(wrapper.vm.name).toBe('')
    expect(wrapper.vm.path).toBe('')
    expect(wrapper.vm.paths).toEqual([])
    expect(wrapper.vm.phraseMatch).toBeTruthy()
    expect(wrapper.vm.project).toBe(project)
    expect(wrapper.vm.published).toBeTruthy()
    expect(wrapper.vm.showAdvancedFilters).toBeFalsy()
  })

  it('should reset the fuzziness to 0 on phraseMatch change', async () => {
    wrapper.vm.$set(wrapper.vm, 'fuzziness', 12)
    await wrapper.vm.$set(wrapper.vm, 'phraseMatch', false)

    expect(wrapper.vm.fuzziness).toBe(0)
  })

  it('should not display "Published" button on local', () => {
    expect(wrapper.find('.card-footer b-form-checkbox-stub').exists()).toBeFalsy()
  })

  it('should display "Published" button on server', () => {
    Murmur.config.merge({ multipleProjects: true })
    wrapper = shallowMount(BatchSearchForm, { i18n, localVue, store })

    expect(wrapper.find('.card .published').exists()).toBeTruthy()
  })

  describe('FileTypes suggestions', () => {
    it('should display suggestions', () => {
      expect(wrapper.contains('selectable-dropdown-stub')).toBeTruthy()
    })

    it('should hide suggestions', () => {
      wrapper.vm.$set(wrapper.vm, 'suggestionFileTypes', ['suggestion_01', 'suggestion_02', 'suggestion_03'])

      wrapper.vm.hideSuggestionsFileTypes()

      expect(wrapper.vm.suggestionFileTypes).toEqual([])
    })

    it('should filter fileTypes according to the fileTypes input on mime file', () => {
      wrapper.vm.$set(wrapper.vm, 'allFileTypes', [{ label: 'Visio document', mime: 'visio' }, { label: 'StarWriter 5 document', mime: 'vision' }, { label: 'Something else', mime: 'else' }])
      wrapper.vm.$set(wrapper.vm, 'fileType', 'visi')

      wrapper.vm.searchFileTypes()

      expect(wrapper.vm.suggestionFileTypes).toHaveLength(2)
      expect(wrapper.vm.suggestionFileTypes[0].label).toBe('Visio document')
      expect(wrapper.vm.suggestionFileTypes[1].label).toBe('StarWriter 5 document')
    })

    it('should filter according to the fileTypes input on label file', () => {
      wrapper.vm.$set(wrapper.vm, 'allFileTypes', [{ label: 'Label PDF', mime: 'PDF' }, { label: 'another type', mime: 'other' }])
      wrapper.vm.$set(wrapper.vm, 'fileType', 'PDF')

      wrapper.vm.searchFileTypes()

      expect(wrapper.vm.suggestionFileTypes).toHaveLength(1)
      expect(wrapper.vm.suggestionFileTypes[0].label).toBe('Label PDF')
    })

    it('should hide already selected file type from suggestions', () => {
      wrapper.vm.$set(wrapper.vm, 'fileTypes', [{ mime: 'application/pdf', label: 'Portable Document Format (PDF)' }])
      wrapper.vm.$set(wrapper.vm, 'fileType', 'PDF')

      wrapper.vm.searchFileTypes()

      expect(wrapper.vm.suggestionFileTypes).toHaveLength(0)
    })

    it('should set the clicked item in fileTypes', () => {
      wrapper = mount(BatchSearchForm, { i18n, localVue, store })
      wrapper.vm.$set(wrapper.vm, 'fileTypes', [{ label: 'Excel 2003 XML spreadsheet visio' }])
      wrapper.vm.$set(wrapper.vm, 'selectedFileType', { label: 'StarWriter 5 document' })
      wrapper.vm.searchFileType()

      expect(wrapper.vm.fileTypes).toEqual([{ label: 'Excel 2003 XML spreadsheet visio' }, { label: 'StarWriter 5 document' }])
    })
  })

  describe('Paths suggestions', () => {
    it('should hide already selected paths from suggestions', () => {
      wrapper.vm.$set(wrapper.vm, 'allPaths', ['folder_01', 'folder_02', 'folder_03'])
      wrapper.vm.$set(wrapper.vm, 'paths', ['folder_01'])
      wrapper.vm.$set(wrapper.vm, 'path', '_01')

      wrapper.vm.searchPaths()

      expect(wrapper.vm.suggestionPaths).toHaveLength(0)
    })
  })

  describe('buildTreeFromPaths', () => {
    it('should extract all the first level paths', () => {
      const tree = wrapper.vm.buildTreeFromPaths(['/folder_01', '/folder_02', '/folder_03'])

      expect(tree).toEqual(['folder_01', 'folder_02', 'folder_03'])
    })

    it('should extract all the levels of the path', () => {
      const tree = wrapper.vm.buildTreeFromPaths(['/folder_01/folder_02/folder_03'])

      expect(tree).toEqual(['folder_01', 'folder_01/folder_02', 'folder_01/folder_02/folder_03'])
    })

    it('should filter by uniq paths', () => {
      const tree = wrapper.vm.buildTreeFromPaths(['/folder_01/folder_02', '/folder_01/folder_03'])

      expect(tree).toEqual(['folder_01', 'folder_01/folder_02', 'folder_01/folder_03'])
    })

    it('should filter off the dataDir', () => {
      const tree = wrapper.vm.buildTreeFromPaths(['/root/project/folder_01'])

      expect(tree).toEqual(['folder_01'])
    })
  })

  describe('On project change', () => {
    it('should reset fileType and path', async () => {
      wrapper.vm.$set(wrapper.vm, 'fileType', 'fileTypeTest')
      wrapper.vm.$set(wrapper.vm, 'path', 'pathTest')
      await wrapper.vm.$set(wrapper.vm, 'project', anotherProject)

      expect(wrapper.vm.fileType).toBe('')
      expect(wrapper.vm.path).toBe('')
    })

    it('should reset fileTypes and paths', async () => {
      wrapper.vm.$set(wrapper.vm, 'fileTypes', ['fileType_01', 'fileType_02'])
      wrapper.vm.$set(wrapper.vm, 'paths', ['path_01', 'path_02'])
      await wrapper.vm.$set(wrapper.vm, 'project', anotherProject)

      expect(wrapper.vm.fileTypes).toEqual([])
      expect(wrapper.vm.paths).toEqual([])
    })

    it('should reset allFileTypes and allPaths', async () => {
      wrapper.vm.$set(wrapper.vm, 'allFileTypes', ['fileType_01', 'fileType_02'])
      wrapper.vm.$set(wrapper.vm, 'allPaths', ['path_01', 'path_02'])
      await wrapper.vm.$set(wrapper.vm, 'project', anotherProject)

      expect(wrapper.vm.allFileTypes).toEqual([])
      expect(wrapper.vm.allPaths).toEqual([])
    })

    it('should call hideSuggestionsFileTypes and hideSuggestionsPaths', async () => {
      jest.spyOn(wrapper.vm, 'hideSuggestionsFileTypes')
      jest.spyOn(wrapper.vm, 'hideSuggestionsPaths')

      await wrapper.vm.$set(wrapper.vm, 'project', anotherProject)

      expect(wrapper.vm.hideSuggestionsFileTypes).toBeCalled()
      expect(wrapper.vm.hideSuggestionsPaths).toBeCalled()
    })
  })

  describe('should load contentTypes and paths from the current project', () => {
    it('should call retrieveFileTypes and retrievePaths on showAdvancedFilters change', async () => {
      jest.spyOn(wrapper.vm, 'retrieveFileTypes')
      jest.spyOn(wrapper.vm, 'retrievePaths')

      await wrapper.vm.$set(wrapper.vm, 'showAdvancedFilters', true)

      expect(wrapper.vm.retrieveFileTypes).toBeCalled()
      expect(wrapper.vm.retrievePaths).toBeCalled()
    })

    it('should return all the content types', async () => {
      await letData(es).have(new IndexedDocument('document_01', project).withContentType('contentType_01')).commit()
      await letData(es).have(new IndexedDocument('document_02', project).withContentType('contentType_02')).commit()
      await letData(es).have(new IndexedDocument('document_03', project).withContentType('contentType_03')).commit()
      await letData(es).have(new IndexedDocument('document_04', project).withContentType('contentType_04')).commit()
      await letData(es).have(new IndexedDocument('document_05', project).withContentType('contentType_05')).commit()
      await letData(es).have(new IndexedDocument('document_06', project).withContentType('contentType_06')).commit()
      await letData(es).have(new IndexedDocument('document_07', project).withContentType('contentType_07')).commit()
      await letData(es).have(new IndexedDocument('document_08', project).withContentType('contentType_08')).commit()
      await letData(es).have(new IndexedDocument('document_09', project).withContentType('contentType_09')).commit()
      await letData(es).have(new IndexedDocument('document_10', project).withContentType('contentType_10')).commit()
      await letData(es).have(new IndexedDocument('document_11', project).withContentType('contentType_11')).commit()

      await wrapper.vm.retrieveFileTypes()

      expect(wrapper.vm.allFileTypes).toHaveLength(11)
    })

    it('should return content type description if exists', async () => {
      await letData(es).have(new IndexedDocument('document', project).withContentType('application/pdf')).commit()

      await wrapper.vm.retrieveFileTypes()

      expect(wrapper.vm.allFileTypes).toEqual([{
        extensions: ['.pdf'],
        label: 'Portable Document Format (PDF)',
        mime: 'application/pdf'
      }])
    })

    it('should return content type itself if content type description does NOT exist', async () => {
      await letData(es).have(new IndexedDocument('document', project).withContentType('application/test')).commit()

      await wrapper.vm.retrieveFileTypes()

      expect(wrapper.vm.allFileTypes).toEqual([{
        extensions: [],
        label: 'application/test',
        mime: 'application/test'
      }])
    })
  })
})
