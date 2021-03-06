<template>
  <div class="container-fluid py-3 document__content">
    <div class="document__content__tags">
      <h5>
        {{ $t('document.tags') }}
      </h5>
      <p class="text-muted">
        {{ $t('document.tagsVisibility') }}
      </p>
      <document-tags-form :document="document" :tags="tags" :displayTags="true" :displayForm="true" />
    </div>
    <div class="document__content__details">
      <h5>
        {{ $t('document.details') }}
      </h5>
      <p class="text-muted">
        {{ $t('document.detailsInfo') }}
      </p>
      <div class="row document__content__details__children m-2">
        <router-link :to="{ name: 'search', query: { q: `_routing:${document.id}`, index } }">
          {{ $t('document.searchChildrenDocument') }}
        </router-link>
      </div>
      <div class="row document__content__details__item" v-for="field in filteredCanonicalFields" :key="field.name">
        <div class="col-sm-4 pr-0 font-weight-bold d-flex justify-content-between">
          <div class="text-truncate mr-1 w-100" :title="field.name">
            {{ field.label }}
          </div>
          <div class="mr-auto document__content__details__item__search">
            <router-link :to="{ name: 'search', query: { q: document.valueAsQueryParam(field.name, field.rawValue !== undefined ? field.rawValue : field.value), index } }">
              <fa icon="search" />
            </router-link>
          </div>
        </div>
        <div class="col-sm-8">
          <div class="w-100 text-truncate" :class="field.class">
            <component :is="field.component || 'div'" :title="field.value">
              <span v-if="field.value === 'unknown'">
                {{ $t('document.unknown') }}
              </span>
              <span v-else>
                {{ field.value }}
              </span>
            </component>
          </div>
        </div>
      </div>
      <div class="row document__content__details__item" v-for="name in metaFieldsNames" :key="name">
        <div class="col-sm-4 pr-0 font-weight-bold d-flex justify-content-between">
          <div class="text-truncate mr-1 w-100" :title="name">
            <var>{{ document.shortMetaName(name) | startCase }}</var>
          </div>
          <div class="mr-auto document__content__details__item__search">
            <router-link :to="{ name: 'search', query: { q: document.metaAsQueryParam(name), index } }">
              <fa icon="search" />
            </router-link>
          </div>
        </div>
        <div class="col-sm-8">
          <div class="w-100 text-truncate">
            {{ document.meta(name) }}
          </div>
        </div>
      </div>
      <div class="text-center mt-4">
        <button @click="metadataVisible = !metadataVisible" class="btn btn-outline-primary btn-sm">
          {{ $t(metadataVisible ? 'document.showLessDetails' : 'document.showMoreDetails') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import filter from 'lodash/filter'
import get from 'lodash/get'
import map from 'lodash/map'
import startCase from 'lodash/startCase'
import { mapState } from 'vuex'

import DocumentTagsForm from '@/components/DocumentTagsForm'
import { getDocumentTypeLabel, getExtractionLevelTranslationKey } from '@/utils/utils'

export default {
  name: 'DocumentTabDetails',
  props: {
    document: {
      type: [Object, Array]
    },
    parentDocument: {
      type: Object
    }
  },
  components: {
    DocumentTagsForm
  },
  filters: {
    startCase
  },
  data () {
    return {
      index: this.$store.state.search.index,
      metadataVisible: false
    }
  },
  computed: {
    ...mapState('document', ['tags']),
    documentPath () {
      if (this.$config.get('mountedDataDir')) {
        return this.document.source.path.replace(this.$config.get('dataDir'), this.$config.get('mountedDataDir'))
      } else {
        return this.document.source.path
      }
    },
    metaFieldsNames () {
      if (this.metadataVisible) {
        return filter(this.document.metas, name => map(this.canonicalFields, 'name').indexOf(name) === -1)
      } else {
        return []
      }
    },
    canonicalFields () {
      return [
        {
          name: '_id',
          label: this.$t('document.id'),
          class: 'document__content__id',
          value: this.document.id,
          component: 'code'
        },
        {
          name: 'name',
          label: this.$t('document.name'),
          class: 'document__content__basename',
          value: this.document.basename
        },
        {
          name: 'path',
          label: this.$t('document.path'),
          class: 'document__content__path',
          value: this.documentPath
        },
        {
          name: 'metadata.tika_metadata_creation_date',
          label: this.$t('document.creationDate'),
          class: 'document__content__creation-date',
          value: this.document.meta('creation_date')
        },
        {
          name: 'metadata.tika_metadata_author',
          label: this.$t('document.author'),
          class: 'document__content__author',
          value: this.document.meta('author')
        },
        {
          name: 'extractionDate',
          label: this.$t('document.extractionDate'),
          class: 'document__content__extraction-date',
          value: this.document.source.extractionDate
        },
        {
          name: 'contentLength',
          label: this.$t('document.size'),
          class: 'document__content__content-length',
          value: this.document.humanSize,
          rawValue: this.document.source.contentLength
        },
        {
          name: 'language',
          label: this.$t('document.contentLanguage'),
          class: 'document__content__language',
          value: this.$t(`filter.lang.${this.document.source.language}`),
          rawValue: this.document.source.language
        },
        {
          name: 'contentType',
          label: this.$t('document.contentType'),
          class: 'document__content__content-type',
          value: this.getDocumentTypeLabel(this.document.source.contentType),
          rawValue: this.document.source.contentType
        },
        {
          name: 'contentEncoding',
          label: this.$t('document.contentEncoding'),
          class: 'document__content__content-encoding',
          value: this.document.source.contentEncoding
        },
        {
          name: 'extractionLevel',
          label: this.$t('filter.extractionLevel'),
          class: 'document__content__tree-level',
          value: this.$t(this.getExtractionLevelTranslationKey(this.document.source.extractionLevel)),
          rawValue: this.document.source.extractionLevel
        },
        {
          name: 'metadata.tika_metadata_message_raw_header_thread_index',
          label: this.$t('document.threadIndex'),
          class: 'document__content__thread',
          value: this.document.threadIndex
        },
        {
          name: 'parentDocument',
          label: this.$t('document.parent'),
          class: 'document__content__parent',
          value: get(this, 'parentDocument.basename', null)
        }
      ]
    },
    filteredCanonicalFields () {
      return filter(this.canonicalFields, field => field.value)
    }
  },
  async created () {
    await this.$store.dispatch('document/getTags')
  },
  methods: {
    getDocumentTypeLabel,
    getExtractionLevelTranslationKey
  }
}
</script>

<style lang="scss" scoped>
  .tab-pane {
    & div {
      word-wrap: break-word;
    }
  }

  .document {

    &__content {

      &__details {

        &__item {
          padding: $spacer * 0.3 0;

          &__search {
            display: none;
          }

          &:hover &__search {
            display: block;
          }
        }

        &__item:nth-child(even) {
          background: #f3f3f3;
        }
      }
    }
  }

</style>
