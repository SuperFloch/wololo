<template>
  <q-header elevated style="background-image:url('img/frise.jpg')">
    <span>Wololo</span>
    <div class="fixed-top-right">
      <q-btn round :icon="muted ? 'volume_off' : 'volume_up'" color="blue" size="sm" glossy class="q-mr-sm" @click="toggleSound" title="Mute"></q-btn>
      <q-btn round icon="wash" color="orange" size="sm" glossy class="q-mr-sm" @click="clear" title="Clear cache"></q-btn>
      <q-btn round icon="close" color="red" size="sm" glossy @click="quit"></q-btn>
    </div>
  </q-header>
  <q-page class="pageBody">
    <div class="sideBar">
      <file-manager @change="onMainFileChange" ref="fileManager"></file-manager>
    </div>
    <div class="convertPart">
      <div class="tabHead row">
        <q-tabs v-model="tab" class="text-indigo-5 bg-amber-2" :active-color="'indigo-10'" active-bg-color="amber-5">
          <q-tab name="convert" icon="church" label="Conversion" />
          <q-tab name="videoClip" icon="movie" label="Video Clip" />
          <q-tab name="videoCrop" icon="crop" label="Video Crop" />
          <q-tab name="ytTool" icon="download" label="Youtube" />
          <q-tab name="removeBg" icon="portrait" label="Remove Bg" />
        </q-tabs>
      </div>

      <div>
        <q-tab-panels v-model="tab" animated class="text-white main">
          <q-tab-panel name="convert">
            <ConvertPage @error="toast" :muted="muted" :inputFile="currentInputFile" @output="refreshHistory"></ConvertPage>
          </q-tab-panel>
          <q-tab-panel name="videoClip">
            <VideoClipPage @error="toast" :muted="muted" :inputFile="currentInputFile" @output="refreshHistory"></VideoClipPage>
          </q-tab-panel>
          <q-tab-panel name="videoCrop">
            <VideoCropPage @error="toast" :muted="muted" :inputFile="currentInputFile" @output="refreshHistory"></VideoCropPage>
          </q-tab-panel>
          <q-tab-panel name="ytTool">
            <VideoDownloadPage @error="toast" :muted="muted" @output="refreshHistory"></VideoDownloadPage>
          </q-tab-panel>
          <q-tab-panel name="removeBg">
            <RemoveBgPage @error="toast" :muted="muted" :inputFile="currentInputFile" @output="refreshHistory"></RemoveBgPage>
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
import FileManager from 'src/components/FileManager.vue';

export default defineComponent({
  name: 'IndexPage',
  components: {
    ConvertPage,
    VideoDownloadPage,
    VideoClipPage,
    VideoCropPage,
    RemoveBgPage,
    FileManager
  },
  data() {
    return {
      lastError: null,
      lastInfo: null,
      muted: false,
      currentInputFile: null
    }
  },
  setup() {
    return {
      tab: ref('convert')
    }
  },
  methods: {
    toast(msg, error = true) {
      if (error) {
        this.lastError = msg;
      } else {
        this.lastInfo = msg;
      }
      setTimeout(() => {
        this.lastError = null;
        this.lastInfo = null;
      }, 5000)
    },
    quit() {
      window.ipcRenderer.send('quit')
    },
    clear() {
      window.ipcRenderer.invoke('clear').then(() => {
        this.toast('Cache cleared', false)
      })
    },
    toggleSound() {
      this.muted = !this.muted
    },
    onMainFileChange(file){
      this.currentInputFile = file
    },
    refreshHistory(){
      this.$refs.fileManager.loadHistory()
    }
  }
})
</script>
<style scoped>
.main {
  background-color: transparent;
}

.pageBody {
  display: flex;
  justify-content: space-between;
}

.sideBar {
  width: 20vw;
}

.convertPart {
  width: 80vw;
}

header {
  height: 8vh;
  background-size: contain;
  text-align: center;
  font-size: 6vh;
  font-family: 'Brush Script MT', cursive;
}

.errorToast {
  position: fixed;
  margin: auto;
  bottom: 5vh;
  left: 0;
  right: 0;
  text-align: center;
  background-color: red;
  width: 50%;
}

.infoToast {
  position: fixed;
  margin: auto;
  bottom: 5vh;
  left: 0;
  right: 0;
  text-align: center;
  background-color: rgb(136, 164, 255);
  width: 50%;
}
</style>
