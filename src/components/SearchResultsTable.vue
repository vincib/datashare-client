<template>
  <div class="search-results-table">
    <div v-if="hasResults">
      <div class="d-flex mb-2">
        <div v-if="selected.length" class="d-inline-flex search-results-table__actions mr-2 align-self-start align-items-center">
          <b-list-group horizontal>
            <b-list-group-item class="search-results-table__actions__action py-2" button v-for="action in actions" :key="action.id" @click="onClick(action.id)">
              <fa :icon="action.icon" :class="action.iconClass" />
              {{ action.label }}
            </b-list-group-item>
          </b-list-group>
          <document-tags-form class="search-results-table__actions__action mx-2" :document="selected" :displayTags="false" :displayForm="true" />
        </div>
        <search-results-header position="top" class="flex-grow-1 align-self-center" :no-progress="!!selected.length" :no-filters="!!selected.length" />
      </div>
      <b-table
        striped
        hover
        selectable
        responsive
        @row-selected="onRowSelected"
        :items="itemsProvider"
        :fields="fields"
        :busy="isBusy"
        class="bg-white border-bottom m-0 small search-results-table__items"
        selected-variant="tertiary"
        tbody-tr-class="search-results-table__items__row"
        thead-tr-class="text-nowrap"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc">
        <template v-slot:cell(relevance)="{ item, rowSelected }" >
          <fa :icon="item.contentTypeIcon" fixed-width class="search-results-table__items__row__icon" />
          <fa :icon="['far', rowSelected ? 'check-square' : 'square']" fixed-width class="search-results-table__items__row__checkbox" />
        </template>
        <template v-slot:cell(path)="{ item }">
          <router-link :to="{ name: 'document', params: item.routerParams, query: { q: query } }" class="text-truncate search-results-table__items__row__title">
            <document-sliced-name :document="item" />
          </router-link>
        </template>
        <template v-slot:cell(highlight)="{ value }">
          <span v-html="value" class="text-truncate text-muted"></span>
        </template>
        <template v-slot:cell(contentLength)="{ value }">
          {{ humanSize(value) }}
        </template>
        <template v-slot:cell(actions)="{ item }">
          <document-actions :document="item" class="float-right btn-group-sm" :is-download-allowed="isDownloadAllowed" />
        </template>
      </b-table>
      <search-results-header position="bottom" />
    </div>
    <div v-else>
      <div class="search-results-table__header border-0 py-5 d-flex flex-column text-center">
        <div class="search-results-table__header__number-of-results">
          {{ $t('search.results.noResults') }}
        </div>
        <div class="mt-3" v-if="hasFilters">
          {{ $t('search.try') }}
          <reset-filters-button variant="outline-secondary" no-icon />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import find from 'lodash/find'
import { mapState } from 'vuex'

import DocumentActions from '@/components/DocumentActions'
import DocumentSlicedName from '@/components/DocumentSlicedName'
import DocumentTagsForm from '@/components/DocumentTagsForm'
import ResetFiltersButton from '@/components/ResetFiltersButton'
import SearchResultsHeader from '@/components/SearchResultsHeader'
import humanSize from '@/filters/humanSize'
import settings from '@/utils/settings'

export default {
  name: 'SearchResultsTable',
  components: {
    DocumentActions,
    DocumentSlicedName,
    DocumentTagsForm,
    ResetFiltersButton,
    SearchResultsHeader
  },
  data () {
    return {
      isBusy: false,
      selected: []
    }
  },
  computed: {
    ...mapState('search', ['isDownloadAllowed', 'query', 'response']),
    actions () {
      return [{
        id: 'star',
        label: this.$t('document.starButton'),
        icon: ['fa', 'star']
      }, {
        id: 'unstar',
        label: this.$t('document.unstarButton'),
        icon: ['far', 'star']
      }]
    },
    hasResults () {
      return this.response.hits.length > 0
    },
    hasFilters () {
      return this.$store.getters['search/activeFilters'].length > 0 || this.$store.state.search.field !== settings.defaultSearchField
    },
    defaultSortField () {
      return this.fields[0]
    },
    sortBy: {
      get () {
        const { field } = this.$store.getters['search/sortBy']
        const { key } = find(this.fields, { sortBy: field }) || this.defaultSortField
        return key
      },
      set () {
        return null
      }
    },
    sortDesc: {
      get () {
        return this.$store.getters['search/sortBy'].desc
      },
      set () {
        return null
      }
    },
    fields () {
      return [
        {
          key: 'relevance',
          label: '#',
          headerTitle: 'relevance',
          class: 'pr-1'
        },
        {
          key: 'path',
          sortBy: 'path',
          sortable: true,
          label: this.$t('document.document') + (this.$store.getters['search/sortBy'].field === 'path' ? ` (${this.$t('search.results.sortedByPath')})` : ''),
          class: 'pl-0'
        },
        {
          key: 'highlight',
          headerTitle: 'highlight',
          formatter (value) {
            return value ? value.content.join(' [...] ') : ''
          }
        },
        {
          key: 'creationDateHumanShort',
          sortBy: 'metadata.tika_metadata_creation_date',
          sortable: true,
          label: this.$t('document.creationDate')
        },
        {
          key: 'contentLength',
          sortBy: 'contentLength',
          sortable: true,
          label: this.$t('document.size'),
          formatter (value, name, item) {
            return item.source.contentLength
          }
        },
        {
          key: 'actions',
          label: '',
          headerTitle: 'actions',
          class: 'search-results-table__items__row__actions'
        }
      ]
    }
  },
  methods: {
    onRowSelected (items) {
      this.selected = items
    },
    async onClick (actionId) {
      this.isBusy = true
      switch (actionId) {
        case 'star':
          await this.$store.dispatch('search/starDocuments', this.selected)
          this.$bvToast.toast(this.$t('document.starred'), { noCloseButton: true, variant: 'success' })
          break
        case 'unstar':
          await this.$store.dispatch('search/unstarDocuments', this.selected)
          this.$bvToast.toast(this.$t('document.unstarred'), { noCloseButton: true, variant: 'success' })
          break
        default:
          break
      }
      this.isBusy = false
    },
    async itemsProvider ({ sortBy, sortDesc }) {
      // Refresh response only if sortBy or sortDesc are different from the state
      if (sortBy !== this.sortBy || sortDesc !== this.sortDesc) {
        // Find the table field for the sorting key (or use the first by default)
        const tableField = find(this.fields, { key: sortBy }) || this.defaultSortField
        // Find the corresponding sort field in the settings
        const sortField = find(settings.searchSortFields, { field: tableField.sortBy, desc: sortDesc })
        // Update the sort value in the store
        this.$store.commit('search/sort', sortField ? sortField.name : 'relevance')
        // Refresh the store without changing the "isReady"
        await this.$store.dispatch('search/refresh', false)
      }
      return this.response.hits
    },
    humanSize (value) {
      const size = humanSize(value)
      return size === 'unknown' ? this.$t('document.unknown') : size
    }
  }
}
</script>

<style lang="scss">
  .search-results-table {
    padding: 0 0 $spacer;

    &__items {

      &__row {

        &__title:visited:not(.router-link-active) {
          color: mix(#609, white, 50%);
        }

        table tbody tr:not(.b-table-row-selected):not(:hover) &__checkbox,
        table tbody tr.b-table-row-selected &__icon,
        table tbody tr:hover &__icon {
          display: none;
        }

        table tbody tr &__checkbox,
        table tbody tr &__icon {
          color: $link-color;
        }

        table tbody tr &__actions {
          padding: 0;
          vertical-align: middle;
        }

        td .text-truncate {
          max-width: 20vw;
          display: block;

          .document-sliced-name {
            display: inline;
          }
        }
      }
    }

    &__actions {
      background: $body-bg;
      font-size: 0.8rem;

      &__action.document-tags-form {
        align-self: stretch;
        display: inline-flex;

        & > div, input.form-control {
          align-self: stretch;
          height: 100%;
        }
      }

      &__action.list-group-item-action {
        color: $primary;
        width: auto;

        svg {
          margin-right: .5em;
        }

        &:hover {
          color: theme-color('dark');
        }
      }
    }
  }
</style>
