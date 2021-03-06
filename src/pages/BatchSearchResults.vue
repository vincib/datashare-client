<template>
  <div class="batch-search-results">
    <div class="batch-search-results__explanation bg-white py-5">
      <div class="container">
        <div class="float-right d-flex my-2 mx-3">
          <div class="batch-search-results__download float-right" v-if="results.length > 0">
            <a :href="downloadLink" class="btn btn-primary">
              <fa icon="download"></fa>
              {{ $t('batchSearchResults.downloadResults') }} (CSV)
            </a>
          </div>
          <div class="batch-search-results__delete" v-if="isMyBatchSearch">
            <confirm-button class="btn btn-primary ml-2" :confirmed="deleteBatchSearch">
              <fa icon="trash-alt"></fa>
              {{ $t('batchSearch.delete') }}
            </confirm-button>
          </div>
        </div>
        <h3>
          <router-link :to="{ name: 'batch-search' }">
            {{ $t('batchSearch.title') }}
          </router-link>
          <fa icon="angle-right" class="small ml-2"></fa>
          {{ meta.name }}
        </h3>
        <p class="m-0">
          {{ meta.description }}
        </p>
      </div>
    </div>
    <div class="container py-4">
      <div class="batch-search-results__info d-flex">
        <dl class="row w-100 mx-0" v-if="Object.keys(meta).length !== 0">
          <dt class="col-sm-4 text-right" v-if="$config.is('multipleProjects')">
            {{ $t('batchSearch.project') }}
          </dt>
          <dd class="col-sm-8" v-if="$config.is('multipleProjects')">
            {{ meta.project.name }}
          </dd>
          <dt class="col-sm-4 text-right">
            {{ $t('batchSearch.state') }}
          </dt>
          <dd class="col-sm-8">
            <b-badge
              :class="{ 'cursor-pointer': isFailed }"
              @click.prevent="openErrorMessage"
              :variant="meta.state | toVariant">
              {{ capitalize(meta.state) }}
            </b-badge>
          </dd>
          <dt class="col-sm-4 text-right">
            {{ $t('batchSearch.date') }}
          </dt>
          <dd class="col-sm-8">
            {{ moment(meta.date).format('LLL') }}
          </dd>
          <dt class="col-sm-4 text-right">
            {{ $t('batchSearch.nbResults') }}
          </dt>
          <dd class="col-sm-8">
            {{ meta.nbResults }}
          </dd>
          <dt class="col-sm-4 text-right">
            {{ $t('batchSearch.phraseMatch') }}
          </dt>
          <dd class="col-sm-8">
            {{ meta.phraseMatches ? $t('indexing.yes') : $t('indexing.no') }}
          </dd>
          <dt class="col-sm-4 text-right">
            {{ fuzzinessLabel }}
          </dt>
          <dd class="col-sm-8">
            {{ meta.fuzziness }}
          </dd>
          <dt class="col-sm-4 text-right">
            {{ $t('batchSearch.fileTypes') }}
          </dt>
          <dd class="col-sm-8">
            <ul v-if="meta.fileTypes.length" class="list-unstyled list-group list-group-horizontal">
              <li v-for="fileType in meta.fileTypes" :key="fileType" class="mr-2">
                <b-badge variant="dark">
                  {{ fileType }}
                </b-badge>
              </li>
            </ul>
            <span v-else>
              {{ $t('indexing.no') }}
            </span>
          </dd>
          <dt class="col-sm-4 text-right">
            {{ $t('batchSearch.path') }}
          </dt>
          <dd class="col-sm-8">
            <ul v-if="meta.paths.length" class="list-unstyled list-group list-group-horizontal">
              <li v-for="path in meta.paths" :key="path" class="mr-2">
                <b-badge variant="dark">
                  {{ path }}
                </b-badge>
              </li>
            </ul>
            <span v-else>
              {{ $t('indexing.no') }}
            </span>
          </dd>
          <dt class="col-sm-4 text-right" v-if="$config.is('multipleProjects')">
            {{ $t('batchSearch.published') }}
          </dt>
          <dd class="col-sm-8" v-if="$config.is('multipleProjects')">
            <b-form-checkbox v-model="published" switch @change="changePublished" v-if="isMyBatchSearch"></b-form-checkbox>
            <span v-else>{{ meta.published ? $t('indexing.yes') : $t('indexing.no') }}</span>
          </dd>
          <dt class="col-sm-4 text-right" v-if="$config.is('multipleProjects')">
            {{ $t('batchSearch.author') }}
          </dt>
          <dd class="col-sm-8" v-if="$config.is('multipleProjects')">
            {{ meta.user.id }}
          </dd>
        </dl>
      </div>
      <v-wait for="load batchSearch results">
        <div slot="waiting" class="card py-2">
          <content-placeholder :rows="rows" class="p-0 my-2"></content-placeholder>
          <content-placeholder :rows="rows" class="p-0 my-2"></content-placeholder>
          <content-placeholder :rows="rows" class="p-0 my-2"></content-placeholder>
        </div>
        <div class="batch-search-results__queries">
          <div class="card small">
            <b-table
              :fields="fields"
              hover
              :items="results"
              no-local-sorting
              :per-page="perPage"
              responsive
              show-empty
              :sort-by="sortBy"
              @sort-changed="sortChanged"
              :sort-desc="orderBy"
              striped
              tbody-tr-class="batch-search-results__queries__query">
              <template v-slot:cell(documentNumber)="{ item }">
                {{ item.documentNumber + 1 }}
              </template>
              <template v-slot:cell(documentName)="{ item }">
                <router-link
                  class="batch-search-results__queries__query__link"
                  target="_blank"
                  :to="{ name: 'document', params: { index: $route.params.index, id: item.documentId, routing: item.rootId }, query: { q: item.query } }">
                  {{ item.documentName }}
                </router-link>
              </template>
              <template v-slot:cell(creationDate)="{ item }">
                {{ moment(item.creationDate).isValid() ? moment(item.creationDate).format('LLL') : '' }}
              </template>
              <template v-slot:cell(contentType)="{ item }">
                {{ getDocumentTypeLabel(item.contentType) }}
              </template>
              <template v-slot:cell(contentLength)="{ item }">
                {{ getDocumentSize(item.contentLength) }}
              </template>
              <template v-slot:cell(empty)>
                <div class="text-center">
                  {{ $t('batchSearchResults.empty') }}
                </div>
              </template>
            </b-table>
          </div>
        </div>
        <b-pagination-nav
          class="mt-2"
          :link-gen="linkGen"
          :number-of-pages="numberOfPages"
          use-router
          v-if="numberOfPages > 1"></b-pagination-nav>
      </v-wait>
    </div>
    <b-modal id="error-modal" :title="$t('batchSearchResults.errorTitle')" ok-only>
      <div v-html="$t('batchSearchResults.errorMessage')"></div>
      <div v-b-toggle.error-message class="my-2 cursor-pointer" @click="showErrorMessage = !showErrorMessage">
        <fa :icon="showErrorMessage ? 'angle-down' : 'angle-right'" class="mr-2"></fa>
        <span>
          {{ $t('batchSearchResults.seeErrorMessage') }}
        </span>
      </div>
      <b-collapse id="error-message" class="code px-3 py-1 text-monospace text-break">
        {{ this.meta.errorMessage }}
      </b-collapse>
    </b-modal>
  </div>
</template>

<script>
import capitalize from 'lodash/capitalize'
import find from 'lodash/find'
import get from 'lodash/get'
import indexOf from 'lodash/indexOf'
import keys from 'lodash/keys'
import sumBy from 'lodash/sumBy'
import moment from 'moment'
import { mapState } from 'vuex'

import Api from '@/api'
import Auth from '@/api/resources/Auth'
import humanSize from '@/filters/humanSize'
import toVariant from '@/filters/toVariant'
import settings from '@/utils/settings'
import { getDocumentTypeLabel } from '@/utils/utils'

export const auth = new Auth()

export default {
  name: 'BatchSearchResults',
  props: {
    uuid: {
      type: String
    },
    index: {
      type: String
    }
  },
  filters: {
    humanSize,
    toVariant
  },
  data () {
    return {
      fields: [
        {
          key: 'documentNumber',
          label: this.$t('batchSearchResults.rank'),
          sortable: true,
          name: 'doc_nb'
        },
        {
          key: 'query',
          label: this.$t('batchSearchResults.query')
        },
        {
          key: 'documentName',
          label: this.$t('batchSearchResults.documentName'),
          sortable: true,
          name: 'doc_name'
        },
        {
          key: 'creationDate',
          label: this.$t('batchSearchResults.creationDate'),
          sortable: true,
          name: 'creation_date'
        },
        {
          key: 'contentType',
          label: this.$t('batchSearchResults.contentType'),
          sortable: true,
          name: 'content_type'
        },
        {
          key: 'contentLength',
          label: this.$t('batchSearchResults.size'),
          sortable: true,
          name: 'content_length'
        }
      ],
      rows: [
        {
          height: '1em',
          boxes: [['10%', '80%']]
        }
      ],
      page: 1,
      queries: [],
      sort: settings.batchSearchResults.sort,
      order: settings.batchSearchResults.order,
      showErrorMessage: false,
      published: false,
      isMyBatchSearch: false
    }
  },
  computed: {
    ...mapState('batchSearch', ['results']),
    fuzzinessLabel () {
      return this.meta.phraseMatches ? this.$t('batchSearch.proximitySearches') : this.$t('batchSearch.fuzziness')
    },
    perPage () {
      return settings.batchSearchResults.size
    },
    meta () {
      return find(this.$store.state.batchSearch.batchSearches, { uuid: this.uuid }) || { }
    },
    downloadLink () {
      return Api.getFullUrl('/api/batch/search/result/csv/' + this.uuid)
    },
    sortBy () {
      return find(this.fields, item => item.name === this.sort).key
    },
    orderBy () {
      return this.order === 'desc'
    },
    numberOfPages () {
      let total
      if (this.$store.state.batchSearch.selectedQueries.length === 0) {
        total = this.meta.nbResults
      } else {
        total = sumBy(keys(this.meta.queries), query => {
          if (indexOf(this.$store.state.batchSearch.selectedQueries, query) > -1) {
            return this.meta.queries[query]
          }
        })
      }
      return Math.ceil(total / this.perPage)
    },
    isFailed () {
      return this.meta.state === 'FAILURE'
    }
  },
  beforeRouteEnter (to, from, next) {
    next(async vm => {
      await vm.fetchBatchSearches()
      await vm.checkIsMyBatchSearch()
      vm.$set(vm, 'published', vm.meta.published)
      vm.$set(vm, 'page', parseInt(get(to.query, 'page', vm.page)))
      vm.$set(vm, 'queries', get(to.query, 'queries', vm.queries))
      vm.$set(vm, 'sort', get(to.query, 'sort', vm.sort))
      vm.$set(vm, 'order', get(to.query, 'order', vm.order))
      await vm.fetch()
    })
  },
  async beforeRouteUpdate (to, from, next) {
    await this.checkIsMyBatchSearch()
    this.$set(this, 'page', parseInt(get(to.query, 'page', this.page)))
    this.$set(this, 'queries', get(to.query, 'queries', this.queries))
    this.$set(this, 'sort', get(to.query, 'sort', this.sort))
    this.$set(this, 'order', get(to.query, 'order', this.order))
    await this.fetch()
    next()
  },
  beforeRouteLeave (to, from, next) {
    this.$store.commit('batchSearch/selectedQueries', [])
    next()
  },
  methods: {
    async fetch () {
      this.$wait.start('load batchSearch results')
      this.$Progress.start()
      await this.fetchBatchSearchResults()
      this.$Progress.finish()
      this.$wait.end('load batchSearch results')
    },
    fetchBatchSearches () {
      return this.$store.dispatch('batchSearch/getBatchSearches')
    },
    fetchBatchSearchResults () {
      const from = (this.page - 1) * this.perPage
      const size = this.perPage
      return this.$store.dispatch('batchSearch/getBatchSearchResults',
        { batchId: this.uuid, from, size, queries: this.queries, sort: this.sort, order: this.order })
    },
    async sortChanged (ctx) {
      const sort = find(this.fields, item => item.key === ctx.sortBy).name
      const order = ctx.sortDesc ? 'desc' : 'asc'
      this.$router.push(this.generateLinkToBatchSearchResults(this.page, this.queries, sort, order))
    },
    filter () {
      this.$router.push(this.generateLinkToBatchSearchResults(1, this.$store.state.batchSearch.selectedQueries))
    },
    linkGen (page) {
      return this.generateLinkToBatchSearchResults(page, this.$store.state.batchSearch.selectedQueries)
    },
    generateLinkToBatchSearchResults (page = this.page, queries = this.queries, sort = this.sort, order = this.order) {
      return {
        name: 'batch-search.results',
        params: { index: this.$route.params.index, uuid: this.$route.params.uuid },
        query: { page, queries: queries.map(query => query.label), sort, order, queries_sort: this.$route.query.queries_sort || undefined }
      }
    },
    async deleteBatchSearch () {
      const isDeleted = await this.$store.dispatch('batchSearch/deleteBatchSearch', { batchId: this.uuid })
      this.$router.push({ name: 'batch-search' })
      this.$root.$bvToast.toast(isDeleted ? this.$t('batchSearch.deleted') : this.$t('batchSearch.notDeleted'),
        { noCloseButton: true, variant: isDeleted ? 'success' : 'warning' })
    },
    getDocumentSize (value) {
      const size = humanSize(value)
      return size === 'unknown' ? this.$t('document.unknown') : size
    },
    changePublished (published) {
      this.$store.dispatch('batchSearch/updateBatchSearch', { batchId: this.uuid, published })
    },
    openErrorMessage () {
      if (this.isFailed) {
        this.$bvModal.show('error-modal')
      }
    },
    async checkIsMyBatchSearch () {
      const username = await auth.getUsername()
      this.isMyBatchSearch = username === get(this, 'meta.user.id', '')
    },
    capitalize,
    getDocumentTypeLabel,
    moment
  }
}
</script>

<style lang="scss">
.batch-search-results {
  &__queries {
    .table-responsive {
      margin: 0;
    }

    table {
      margin: 0;

      thead th {
        border-top: 0;
        white-space: nowrap;
      }
    }
  }
}

.code {
  background: black;
  color: white;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
