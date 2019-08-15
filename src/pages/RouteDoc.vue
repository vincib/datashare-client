<template>
  <div class="route-doc">
    <div class="bg-white border-bottom">
      <div class="container">
        <div class="route-doc__header py-5">
          <h3>
            {{ meta.title }}
          </h3>
          <p class="m-0 route-doc__header__description">
            {{ meta.description }}
          </p>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="route-doc__content card card-body my-4" v-html="html"></div>
    </div>
  </div>
</template>

<script>
import docs from '@/mixins/docs'

export default {
  name: 'RouteDoc',
  mixins: [ docs ],
  props: {
    resourcePath: {
      type: String
    }
  },
  data () {
    return {
      html: null
    }
  },
  computed: {
    meta () {
      return this.findRouteDocMeta(this.resourcePath)
    }
  },
  mounted () {
    this.fetch()
  },
  beforeRouteEnter (to, from, next) {
    next(vm => vm.fetch(to.params.resourcePath))
  },
  async beforeRouteUpdate (to, from, next) {
    await this.fetch(to.params.resourcePath)
    next()
  },
  methods: {
    async fetch (resourcePath = this.resourcePath) {
      const module = await import(/* webpackChunkName: "[request]" */ `../../public/docs/${resourcePath}`)
      this.html = module.default
    }
  }
}
</script>

<style lang="scss">
  .route-doc {
    min-height: 100vh;

    &__header {
      &__description {
        max-width: 880px;
      }
    }

    &__content {

      & > h1 {
        display: none;
      }

      h2 { @include font-size($h2-font-size * .8); }
      h3 { @include font-size($h3-font-size * .8); }
      h4 { @include font-size($h4-font-size * .8); }
      h5 { @include font-size($h5-font-size * .8); }
      h6 { @include font-size($h6-font-size * .8); }

      img  {
        width: auto;
        display: block;
        max-width: 750px;
        max-height: 60vh;
      }
    }
  }
</style>