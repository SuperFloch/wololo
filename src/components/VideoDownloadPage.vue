<template>
    <div class="downloadPage">
        <div class="aoe-title">Download a Youtube video from URL</div>
        <div class="workRow">
            <div class="formCol">
                <q-input label="Url" class="aoe-input" color="indigo-10" v-model="videoUrl" clearable></q-input>
                <div class="btnRow">
                    <q-btn color="indigo-10" class="aoe-btn" glossy icon="movie" @click="downloadVideo" :disable="!videoUrl || isConverting" label="Download"></q-btn>
                    <q-btn color="indigo-10" class="aoe-btn" glossy icon="audiotrack" @click="downloadAudio" :disable="!videoUrl || isConverting" label="Audio Only"></q-btn>
                </div>
            </div>
            <div class="monkCol">
                <MonkAnimation :converting="isConverting" :ready="videoUrl !== ''" ref="monk" :muted="muted"></MonkAnimation>
            </div>
        </div>
        <div class="resultBox" v-show="resultUrl !== null">
            <img src="img/separator.png" class="separator" alt="">
            <div class="aoe-success">Download Succeded !</div>
            <q-btn type="a" glossy color="green" class="aoe-btn aoe-save" icon="save" label="Save" :href="resultUrl" :download="'result.'+outFormat"></q-btn>
        </div>
    </div>
</template>
<script>
import MonkAnimation from './MonkAnimation.vue';
export default {
    components: {
        MonkAnimation
    },
    props:{
        muted: Boolean
    },
    data() {
        return {
            videoUrl: '',
            isConverting: false,
            resultUrl: null,
            outFormat: 'mp4'
        }
    },
    emits:['error', 'output'],
    methods: {
        downloadVideo() {
            this.download('video:download', 'mp4')
        },
        downloadAudio() {
            this.download('audio:download', 'mp3')
        },
        download(channel, format) {
            this.isConverting = true;
            this.resultUrl = null;
            this.outFormat = format
            window.ipcRenderer.invoke(channel, { url: this.videoUrl }).then((result) => {
                if (result.error) {
                    this.$emit('error', result.error);
                    this.$refs.monk.deathSound();
                }else{
                    this.resultUrl = result.data;
                }
                this.$emit('output')
            }).catch(err => {
                this.$emit('error', err.message);
                this.$refs.monk.deathSound();
            }).finally(() => {
                this.isConverting = false;
            });
        }
    }
}
</script>
<style scoped>
.workRow {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: center;
}

.formCol {
    flex: 1 1 18rem;
    min-width: 0;
}

.monkCol {
    flex: 0 1 10rem;
}

.btnRow {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 1rem;
}

.resultBox {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1rem;
}

.separator {
    max-height: 4rem;
    width: auto;
}

.resultBox .aoe-save {
    max-width: 24rem;
}
</style>
