<template>
    <div class="pageBody">
        <div class="row">
            <div class="col-10">
                <div class="head">Download a Youtube video from URL</div>
                <q-input label="Url" class="urlInput" color="indigo-10" v-model="videoUrl"></q-input>
                <q-btn color="indigo-10 glossy downBtn" @click="downloadVideo">Download</q-btn>
                <q-btn color="indigo-10 glossy downBtn" @click="downloadAudio">Download Audio Only</q-btn>
            </div>
            <div class="col-2 monkCol">
                <MonkAnimation :converting="isConverting" :ready="videoUrl !== ''" ref="monk"></MonkAnimation>
            </div>
        </div>
        <div class="row" v-show="resultUrl !== null">
            <div class="margin-auto">
                <img src="img/separator.png">
            </div>
        </div>
        <div class="row" v-show="resultUrl !== null">
            <div class="downloadSuccessText">Download Succeded !</div>
            <a class="q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle q-btn--actionable q-focusable q-hoverable glossy bg-indigo-10 stretch" :href="resultUrl" :download="'result.'+outFormat">Save</a>
        </div>
    </div>
</template>
<script>
import MonkAnimation from './MonkAnimation.vue';
export default {
    components: {
        MonkAnimation
    },
    data() {
        return {
            videoUrl: '',
            isConverting: false,
            resultUrl: null,
            outFormat: 'mp4'
        }
    },
    methods: {
        downloadVideo() {
            this.isConverting = true;
            this.resultUrl = null;
            this.outFormat = 'mp4'
            window.ipcRenderer.invoke('video:download', { url: this.videoUrl }).then((newPath) => {
                if (newPath) {
                    this.resultUrl = this.stringToDataUrl(newPath, 'video/mp4');
                }else{
                    this.$refs.monk.deathSound();
                }
                this.isConverting = false;
            }).catch(err => {
                this.isConverting = false;
                console.log(err.message);
                this.$refs.monk.deathSound();
            });
        },
        downloadAudio() {
            this.isConverting = true;
            this.resultUrl = null;
            this.outFormat = 'mp3'
            window.ipcRenderer.invoke('audio:download', { url: this.videoUrl }).then((newPath) => {
                if (newPath) {
                    this.resultUrl = this.stringToDataUrl(newPath, 'audio/mp3');
                }else{
                    this.$refs.monk.deathSound();
                }
                this.isConverting = false;
            }).catch(err => {
                this.isConverting = false;
                console.log(err.message);
                this.$refs.monk.deathSound();
            });
        },
        stringToDataUrl(buffer,type){
            return 'data:' + type + ';base64,' + buffer;
        }
    }
}
</script>
<style scoped>
.pageBody {
    text-align: center;
}

.head {
    color: rgb(11, 14, 87);
    font-size: 3em;
    font-family: 'Brush Script MT', cursive;
    text-shadow: 1px 1px 4px rgba(76, 58, 29, 0.5);
}
.monkCol{
    padding-top: 40px;
}

.downBtn {
    margin: 2vh 1vw 0 1vw;
    width: 30%;
}
.downloadSuccessText{
    margin: auto;
    color: rgb(11, 87, 26);
    font-size: 5em;
    font-family: 'Brush Script MT', cursive;
    text-shadow: 1px 1px 4px rgba(76, 58, 29, 0.5);
}

.urlInput {
    background: radial-gradient(circle, rgba(230, 197, 101, 1) 0%, rgba(166, 143, 85, 1) 100%);
    border: 4mm ridge rgba(60, 83, 146, 0.733);
}
</style>