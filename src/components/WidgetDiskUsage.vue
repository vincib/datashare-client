<template>
  <div class="widget widget--disk-usage d-flex align-items-center text-center">
    <v-wait for="disk usage" class="flex-grow-1" transition="fade">
      <fa icon="circle-notch" spin slot="waiting" size="2x" />
      <p :class="{ 'card-body': widget.card }">
        <fa icon="weight" class="widget__icon" size="2x" />
        <strong class="widget__main-figure" :title="total">
          {{ humanSize(total, false, $t('human.size')) }}
        </strong>
        <a class="widget__details" v-b-modal.modal-disk-usage-details>
          {{ $t('widget.diskUsage.details') }}
        </a>
      </p>
    </v-wait>
    <b-modal id="modal-disk-usage-details" lazy scrollable hide-header hide-footer body-class="p-0" size="lg">
      <tree-view v-model="selectedPath" />
    </b-modal>
  </div>
</template>

<script>
import bodybuilder from 'bodybuilder'
import { waitFor } from 'vue-wait'

import TreeView from '@/components/TreeView.vue'
import elasticsearch from '@/api/elasticsearch'
import humanSize from '@/filters/humanSize'

export default {
  name: 'WidgetDiskUsage',
  components: {
    TreeView
  },
  props: {
    widget: {
      type: Object
    }
  },
  data () {
    return {
      onDisk: null,
      total: null,
      selectedPath: null
    }
  },
  async created () {
    this.selectedPath = this.dataDir
    await this.loadData()
  },
  computed: {
    dataDir () {
      return this.$config.get('mountedDataDir') || this.$config.get('dataDir')
    }
  },
  mounted () {
    this.$store.subscribe(async ({ type }) => {
      // The index changed
      if (type === 'insights/index') {
        await this.loadData()
      }
    })
  },
  methods: {
    async sumTotal () {
      const index = this.$store.state.insights.project
      // Build the query using Bodynuilder
      const body = bodybuilder()
        // Only documents...
        .andQuery('match', 'type', 'Document')
        // ...on disk
        .andQuery('match', 'extractionLevel', 0)
        // Returns no document
        .size(0)
        // Sum up all sizes
        .aggregation('sum', 'contentLength')
        .build()
      const res = await elasticsearch.search({ index, body, size: 0 })
      // eslint-disable-next-line camelcase
      return res?.aggregations?.agg_sum_contentLength?.value || 0
    },
    loadData: waitFor('disk usage', async function () {
      this.total = await this.sumTotal()
    }),
    humanSize
  }
}
</script>

<style lang="scss" scoped>
  .widget {
    min-height: 100%;

    &__main-figure {
      font-size: 1.8rem;
      display: block;
    }

    &__details {
      cursor: pointer;
      color: $link-color;

      &:hover {
        text-decoration: underline;
      }
    }
  }
</style>
