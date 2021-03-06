<template>
  <div class="search-results-header" :class="{ 'search-results-header--bordered': bordered, [`search-results-header--${position}`]: true }">
    <div class="search-results-header__paging">
      <div class="search-results-header__paging__progress text-truncate" v-if="!noProgress">
        <span class="search-results-header__paging__progress__pagination">
          {{ $store.state.search.from + 1 }} – {{ lastDocument }}
        </span>
        <span class="search-results-header__paging__progress_number-of-results">
          {{ $t('search.results.on') }} {{ $tc('search.results.results', response.total, { total: $n(response.get('hits.total')) }) }}
        </span>
      </div>
      <pagination
        class="flex-grow-1 justify-content-end text-right mr-3"
        :get-to-template="getToTemplate"
        :is-displayed="isDisplayed"
        :no-last-page-link="searchWindowTooLarge"
        :position="position"
        :total="response.total"></pagination>
    </div>
    <search-results-applied-filters v-if="position === 'top' && !noFilters" />
  </div>
</template>

<script>
import cloneDeep from 'lodash/cloneDeep'
import min from 'lodash/min'
import { mapState } from 'vuex'

import Pagination from '@/components/Pagination'
import SearchResultsAppliedFilters from '@/components/SearchResultsAppliedFilters'

export default {
  name: 'SearchResultsHeader',
  components: {
    Pagination,
    SearchResultsAppliedFilters
  },
  props: {
    position: {
      type: String,
      default: 'top',
      validator: value => ['top', 'bottom'].indexOf(value) >= -1
    },
    bordered: {
      type: Boolean
    },
    noProgress: {
      type: Boolean
    },
    noFilters: {
      type: Boolean
    }
  },
  computed: {
    ...mapState('search', ['response']),
    lastDocument () {
      return min([this.response.total, this.$store.state.search.from + this.$store.state.search.size])
    },
    searchWindowTooLarge () {
      return (this.response.total + this.$store.state.search.size) >= this.$config.get('search.maxWindowSize', 1e4)
    }
  },
  mounted () {
    // Force page to scroll top at each load
    // Specially for pagination
    document.body.scrollTop = document.documentElement.scrollTop = 0
  },
  methods: {
    getToTemplate () {
      return { name: 'search', query: cloneDeep(this.$store.getters['search/toRouteQuery']()) }
    },
    isDisplayed () {
      return this.response.total > this.$store.state.search.size
    }
  }
}
</script>

<style lang="scss">
  .search-results-header {
    padding: 0.5 * $spacer 0;

    &--bordered {
      &.search-results-header--top {
        border-bottom: 1px solid $gray-200;
      }
      &.search-results-header--bottom {
        border-top: 1px solid $gray-200;
      }
    }

    &__paging {
      font-size: 0.95em;
      color: $text-muted;
      display: inline-flex;
      width: 100%;

      &__progress {

        > div {
          display: inline-block;
        }
      }
    }
  }
</style>
