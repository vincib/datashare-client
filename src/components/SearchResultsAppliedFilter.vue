<template>
  <b-badge variant="warning" pill class="mr-2 pl-1 search-results-header__applied-filters__filter" :class="filter.negation ? 'strikethrough' : ''" @click.prevent="deleteQueryTerm()">
    <fa icon="times-circle" />
    {{ filter.label | displayUser }}
  </b-badge>
</template>

<script>
import displayUser from '@/filters/displayUser'

export default {
  name: 'SearchResultsAppliedFilter',
  props: {
    filter: {
      type: Object
    }
  },
  filters: {
    displayUser
  },
  methods: {
    async deleteQueryTerm () {
      if ('name' in this.filter) {
        await this.$store.dispatch('search/removeFilterValue', this.filter)
        this.$root.$emit('filter::search::update', this.filter.name)
      } else {
        await this.$store.dispatch('search/deleteQueryTerm', this.filter.value)
      }
      this.$router.push({ name: 'search', query: this.$store.getters['search/toRouteQuery']() }).catch(() => {})
    }
  }
}
</script>

<style lang="scss">
  .search-results-header__applied-filters__filter {
    cursor: pointer;

    &.strikethrough {
      text-decoration: line-through;
    }
  }
</style>
