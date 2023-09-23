<template>
  <q-page class="flex flex-center">
    <div clas="tabContent">
        <q-tab-panels v-model="tab" animated class="bg-white text-white">
            <q-tab-panel name="convert">
              <ConvertPage></ConvertPage>
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
