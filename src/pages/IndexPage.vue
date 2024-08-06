<template>
  <q-header elevated style="background-image:url('img/frise.jpg')">
    <span>Wololo</span>
    <div class="fixed-top-right">
      <q-btn round icon="wash" color="orange" size="sm" glossy class="q-mr-sm" @click="clear" title="Clear cache"></q-btn>
      <q-btn round icon="close" color="red" size="sm" glossy @click="quit"></q-btn>
    </div>
  </q-header>
  <q-page class="">
    <div class="tabHead row">
        <q-tabs v-model="tab" class="text-indigo-5 bg-amber-2" :active-color="'indigo-10'" active-bg-color="amber-5">
          <q-tab name="convert" icon="church" label="Conversion"/>
          <q-tab name="videoClip" icon="movie" label="Video Clip" />
          <q-tab name="videoCrop" icon="crop" label="Video Crop" />
          <q-tab name="ytTool" icon="download" label="Youtube" />
          <q-tab name="removeBg" icon="portrait" label="Remove Bg" />
        </q-tabs>
    </div>
    <div>
        <q-tab-panels v-model="tab" animated class="text-white main">
            <q-tab-panel name="convert">
              <ConvertPage @error="toast"></ConvertPage>
            </q-tab-panel>
            <q-tab-panel name="videoClip">
              <VideoClipPage @error="toast"></VideoClipPage>
            </q-tab-panel>
            <q-tab-panel name="videoCrop">
              <VideoCropPage @error="toast"></VideoCropPage>
            </q-tab-panel>
            <q-tab-panel name="ytTool">
              <VideoDownloadPage @error="toast"></VideoDownloadPage>
            </q-tab-panel>
            <q-tab-panel name="removeBg">
              <RemoveBgPage @error="toast"></RemoveBgPage>
            </q-tab-panel>
          </q-tab-panels>
      </div>
      <div class="errorToast" v-show="lastError != null">
            <div>Error</div>
            <div>{{ lastError }}</div>
        </div>
        <div class="infoToast" v-show="lastInfo != null">
            <div>Info</div>
            <div>{{ lastInfo }}</div>
        </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import ConvertPage from 'components/ConvertPage.vue';
import VideoDownloadPage from 'src/components/VideoDownloadPage.vue';
import VideoClipPage from 'src/components/VideoClipPage.vue';
import VideoCropPage from 'src/components/VideoCropPage.vue';
import RemoveBgPage from 'src/components/RemoveBgPage.vue';

export default defineComponent({
  name: 'IndexPage',
  components: {
    ConvertPage,
    VideoDownloadPage,
    VideoClipPage,
    VideoCropPage,
    RemoveBgPage
  },
  data(){
    return {
      lastError: null,
      lastInfo: null
    }
  },
  setup () {
    return {
      tab: ref('convert')
    }
  },
  methods:{
    toast(msg, error = true){
      if(error){
        this.lastError = msg;
      }else{
        this.lastInfo = msg;
      }
      setTimeout(()=>{
          this.lastError = null;
          this.lastInfo = null;
      }, 5000)
    },
    quit(){
      window.ipcRenderer.send('quit')
    },
    clear(){
      window.ipcRenderer.invoke('clear').then(()=>{
        this.toast('Cache cleared', false)
      })
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
  font-size: 6vh;
  font-family: 'Brush Script MT', cursive;
}
.errorToast{
    position: fixed;
    margin: auto;
    bottom: 5vh;
    left: 0;
    right: 0;
    text-align: center;
    background-color: red;
    width: 50%;
}
.infoToast{
    position: fixed;
    margin: auto;
    bottom: 5vh;
    left: 0;
    right: 0;
    text-align: center;
    background-color: rgb(136, 164, 255);
    width: 50%;
}
.history{
  position: absolute;
  bottom:0;
}
</style>
