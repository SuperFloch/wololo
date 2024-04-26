<template>
  <q-header elevated style="background-image:url('img/frise.jpg')">Wololo</q-header>
  <q-page class="">
    <div class="tabHead row">
        <q-tabs v-model="tab" class="text-teal" :active-color="'indigo-10'">
          <q-tab name="convert" icon="church" label="Conversion"/>
          <q-tab name="ytTool" icon="download" label="Youtube" />
          <q-tab name="videoClip" icon="movie" label="Video Clip" />
          <q-tab name="videoCrop" icon="crop" label="Video Crop" />
        </q-tabs>
    </div>
    <div>
        <q-tab-panels v-model="tab" animated class="text-white main">
            <q-tab-panel name="convert">
              <ConvertPage></ConvertPage>
            </q-tab-panel>
            <q-tab-panel name="ytTool">
              <VideoDownloadPage></VideoDownloadPage>
            </q-tab-panel>
            <q-tab-panel name="videoClip">
              <VideoClipPage></VideoClipPage>
            </q-tab-panel>
            <q-tab-panel name="videoCrop">
              <VideoCropPage></VideoCropPage>
            </q-tab-panel>
          </q-tab-panels>
      </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import ConvertPage from 'components/ConvertPage.vue';
import VideoDownloadPage from 'src/components/VideoDownloadPage.vue';
import VideoClipPage from 'src/components/VideoClipPage.vue';
import VideoCropPage from 'src/components/VideoCropPage.vue';

export default defineComponent({
  name: 'IndexPage',
  components: {
    ConvertPage,
    VideoDownloadPage,
    VideoClipPage,
    VideoCropPage
  },
  setup () {
    return {
      tab: ref('convert')
    }
  }
})
</script>
<style scoped>
.main{
  background-color: transparent;
}
header{
  height: 8vh;
  background-size: contain;
  text-align: center;
  font-size: 3em;
  font-family: 'Brush Script MT', cursive;
}
</style>
