<template>
  <q-page class="">
    <div class="tabHead row">
        <q-tabs v-model="tab" class="text-teal">
          <q-tab name="convert" icon="church" label="Conversion" />
          <q-tab name="videoTools" icon="movie" label="Video Tools" />
        </q-tabs>
    </div>
    <div clas="tabContent row inline">
        <q-tab-panels v-model="tab" animated class="bg-white text-white">
            <q-tab-panel name="convert">
              <ConvertPage></ConvertPage>
            </q-tab-panel>
            <q-tab-panel name="videoTools">
              <div>Video</div>
            </q-tab-panel>
          </q-tab-panels>
      </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import ConvertPage from 'components/ConvertPage.vue';

export default defineComponent({
  name: 'IndexPage',
  components: {
    ConvertPage
  },
  setup () {
    return {
      tab: ref('convert')
    }
  }
})
</script>
<style scoped>

</style>
