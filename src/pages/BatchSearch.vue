<template>
  <div class="batchsearches container pt-4">
    <b-form @submit.prevent="onSubmit">
      <div class="card">
        <div class="card-header">
          <h3 class="h5 m-0">
            {{ $t('batchSearch.title') }}
          </h3>
        </div>
        <div class="m-4">
          <b-form-group
            id="group-name"
            :label="$t('batchSearch.nameLabel')"
            label-for="name"
          >
            <b-form-input
              id="name"
              v-model="name"
              type="text"
              required
              :placeholder="$t('batchSearch.namePlaceholder')"
            ></b-form-input>
          </b-form-group>
          <b-form-group
            id="group-description"
            :label="$t('batchSearch.descriptionLabel')"
            label-for="description"
          >
            <b-form-textarea
              id="description"
              v-model="description"
              :placeholder="$t('batchSearch.descriptionPlaceholder')"
              rows="3"
              max-rows="6"
            ></b-form-textarea>
          </b-form-group>
          <b-form-group
            id="group-file"
            :label="$t('batchSearch.fileLabel')"
            label-for="file"
            :description="$t('batchSearch.fileDescription')"
          >
            <b-form-file
              v-model="csvFile"
              :placeholder="$t('batchSearch.filePlaceholder')"
              accept=".csv"
              required
            ></b-form-file>
          </b-form-group>
        </div>
        <div class="card-footer text-right border-0">
          <b-button type="submit" variant="primary">{{ $t('batchSearch.submit') }}</b-button>
        </div>
      </div>
    </b-form>
  </div>
</template>

<script>
export default {
  name: 'BatchSearches',
  computed: {
    name: {
      get () {
        return this.$store.state.batchSearch.name
      },
      set (name) {
        this.$store.commit('batchSearch/name', name)
      }
    },
    description: {
      get () {
        return this.$store.state.batchSearch.description
      },
      set (description) {
        this.$store.commit('batchSearch/description', description)
      }
    },
    csvFile: {
      get () {
        return this.$store.state.batchSearch.csvFile
      },
      set (csvFile) {
        this.$store.commit('batchSearch/csvFile', csvFile)
      }
    }
  },
  methods: {
    onSubmit () {
      this.$store.dispatch('batchSearch/onSubmit')
    }
  }
}
</script>