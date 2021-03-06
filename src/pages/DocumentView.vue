<template>
  <v-wait for="load document data">
    <content-placeholder class="document py-2 px-3" slot="waiting" />
    <div
      class="d-flex flex-column document"
      :class="{ 'document--simplified': $route.name === 'document-simplified' }"
      v-if="doc"
      v-shortkey="getKeys('tabNavigation')"
      @shortkey="getAction('tabNavigation')">
      <div class="document__header">
        <hook name="document.header:before" />
        <h3 class="document__header__name">
          <hook name="document.header.name:before" />
          <document-sliced-name interactive-root :document="doc" />
          <hook name="document.header.name:after" />
        </h3>
        <hook name="document.header.tags:before" />
        <document-tags-form
          class="px-3 mx-0"
          :displayForm="false"
          :displayTags="true"
          :document="doc"
          mode="dark"
          :tags="tags" />
        <hook name="document.header.tags:after" />
        <hook name="document.header.nav:before" />
        <nav class="document__header__nav text-nowrap overflow-auto">
          <ul class="list-inline m-0">
            <li class="document__header__nav__item list-inline-item" v-for="tab in visibleTabs" :key="tab.name">
              <a @click="activateTab(tab.name)" :class="{ active: isTabActive(tab.name) }">
                <hook :name="`document.header.nav.${tab.name}:before`" />
                <fa :icon="tab.icon" v-if="tab.icon" class="mr-2" />
                {{ $t(tab.label) }}
                <hook :name="`document.header.nav.${tab.name}:after`" />
              </a>
            </li>
          </ul>
        </nav>
        <hook name="document.header.nav:after" />
        <hook name="document.header:after" />
      </div>
      <div class="d-flex flex-grow-1 flex-column tab-content document__content">
        <div
          class="document__content__pane tab-pane flex-grow-1 w-100"
          :class="tabClass(tab.name)"
          :key="tab.name"
          v-for="tab in visibleTabs">
          <component v-if="isTabActive(tab.name)" :is="tab.component" v-bind="tab.props"></component>
        </div>
      </div>
    </div>
    <div v-else class="nodocument">
      <fa icon="exclamation-triangle" />
      <span>{{ $t('document.notFound') }}</span>
    </div>
  </v-wait>
</template>

<script>
import filter from 'lodash/filter'
import findIndex from 'lodash/findIndex'
import { mapState } from 'vuex'

import DocumentSlicedName from '@/components/DocumentSlicedName'
import DocumentTagsForm from '@/components/DocumentTagsForm'
import Hook from '@/components/Hook'
import shortkeys from '@/mixins/shortkeys'

export default {
  name: 'DocumentView',
  mixins: [shortkeys],
  components: {
    DocumentSlicedName,
    DocumentTagsForm,
    Hook
  },
  props: {
    id: {
      type: String
    },
    routing: {
      type: String
    },
    index: {
      type: String
    }
  },
  data () {
    return {
      activeTab: 'extracted-text'
    }
  },
  computed: {
    ...mapState('document', ['doc', 'parentDocument', 'tags']),
    visibleTabs () {
      return filter(this.tabs, t => !t.hidden)
    },
    tabs () {
      return [
        {
          name: 'extracted-text',
          label: 'document.extractedText',
          component: () => import('@/components/document/DocumentTabExtractedText'),
          icon: 'align-left',
          props: {
            document: this.doc
          }
        },
        {
          name: 'preview',
          label: 'document.preview',
          component: () => import('@/components/document/DocumentTabPreview'),
          icon: 'eye',
          props: {
            document: this.doc
          }
        },
        {
          name: 'details',
          label: 'document.tabDetails',
          component: () => import('@/components/document/DocumentTabDetails'),
          icon: 'info-circle',
          props: {
            document: this.doc,
            parentDocument: this.parentDocument
          }
        },
        {
          name: 'translations',
          label: 'document.translations',
          component: () => import('@/components/document/DocumentTabTranslations'),
          hidden: !this.doc.hasTranslations,
          icon: 'globe',
          props: {
            document: this.doc
          }
        },
        {
          name: 'named-entities',
          label: 'document.namedEntities',
          hidden: this.$config.isnt('manageDocuments') && !this.doc.hasNerTags,
          component: () => import('@/components/document/DocumentTabNamedEntities'),
          icon: 'database',
          props: {
            document: this.doc
          }
        }
      ]
    },
    indexActiveTab () {
      return findIndex(this.visibleTabs, tab => tab.name === this.activeTab)
    }
  },
  methods: {
    async getDoc (params = { id: this.id, routing: this.routing, index: this.index }) {
      this.$wait.start('load document data')
      this.$Progress.start()
      await this.$store.dispatch('document/get', params)
      await this.$store.dispatch('document/getParent')
      await this.$store.dispatch('document/getTags')
      await this.$store.dispatch('document/getRecommendationsByDocuments')
      if (this.doc) {
        await this.$store.commit('userHistory/addDocument', this.doc)
        const container = this.$el.closest('.ps-container')
        this.$root.$emit('scroll-tracker:request', this.$el, 0, container)
        this.$root.$emit('document::content::changed')
      }
      this.$wait.end('load document data')
      this.$Progress.finish()
    },
    isTabActive (name) {
      return this.activeTab === name
    },
    activateTab (name) {
      this.$set(this, 'activeTab', name)
      this.$root.$emit('document::content::changed')
      return name
    },
    tabClass (name) {
      return {
        active: this.isTabActive(name),
        ['document__content__pane--' + name]: true
      }
    },
    shortKeyAction (event) {
      switch (event.srcKey) {
        case 'goToPreviousTab':
          this.goToPreviousTab()
          break
        case 'goToNextTab':
          this.goToNextTab()
          break
      }
    },
    goToPreviousTab () {
      const indexPreviousActiveTab = this.indexActiveTab === 0 ? this.visibleTabs.length - 1 : this.indexActiveTab - 1
      this.$set(this, 'activeTab', this.visibleTabs[indexPreviousActiveTab].name)
    },
    goToNextTab () {
      const indexNextActiveTab = this.indexActiveTab === this.visibleTabs.length - 1 ? 0 : this.indexActiveTab + 1
      this.$set(this, 'activeTab', this.visibleTabs[indexNextActiveTab].name)
    }
  },
  beforeRouteEnter (to, _from, next) {
    next(vm => {
      vm.getDoc(to.params)
    })
  },
  beforeRouteUpdate (to, _from, next) {
    this.getDoc(to.params)
    next()
  }
}
</script>

<style lang="scss">
.document {
  background: white;
  margin: 0;

  &--simplified {
    min-height: 100vh;
  }

  .badge-pill {
    overflow: hidden;
  }

  &__header {
    @include gradient-directional($primary, theme-color(dark));
    color: white;
    display: inline-block;
    padding: $spacer * 2 0;
    padding-bottom: 0;
    width: 100%;

    &__name {
      padding: 0 $spacer;

      a, a:hover {
        color: white;
      }
    }

    &__nav {
      padding: $spacer $spacer 0;

      & &__item  {
        margin: 0;

        a {
          cursor: pointer;
          display: inline-block;
          font-size: 0.8em;
          font-weight: bolder;
          margin: 0;
          padding: $spacer * .75 $spacer;
          position: relative;
          text-transform: uppercase;

          &:hover {
            background: rgba(white, .05);
          }

          &.active, &.active:hover {
            background: white;
            color: $link-color;
            font-weight: bold;

            &:before {
              border-top: 2px solid $secondary;
              box-shadow: 0 0 10px 0 $secondary;
              content: "";
              left: 0;
              position: absolute;
              right: 0;
              top: 0;
            }
          }
        }
      }
    }
  }

  .ner {
    border-bottom: 1px dotted;
  }

  &__content {

    .tab-content > &__pane--preview.active {
      display: flex;
    }
  }
}

.nodocument {
  background-color: white;
  font-weight: 800;
  margin: 1em;
  padding: 1em;

  & span {
    margin-left: 1em;
  }
}
</style>
