<template>
    <div class="p-relative">
        <div class="row convertLine">
            <div ref="input" class="col-4">
                <MediaDisplayer v-if="inputFile != null" :src="inputFile.data" ref="media" @load="onLoad"></MediaDisplayer>
            </div>
            <div ref="monk" class="col-4">
                <div class="monk">
                    <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
                </div>
                <div class="row resultLine flex-center" v-if="resultFile != null">
                    <div class="downloadSuccessText">Conversion Succeded !</div>
                    <div class="col-12">
                        <a class="q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle q-btn--actionable q-focusable q-hoverable glossy bg-green stretch" :href="resultFile.data" :download="computeResultFileName">Save</a>
                    </div>
                </div>
            </div>
            <div ref="output" class="col-4 p-relative">
                <canvas ref="imgRenderer" hidden></canvas>
                <div class="p-relative convertButtonList">
                    <img src="img/parcheminBg.png" class="parchemin w-100">
                    <div class="listContainer">
                        <div class="listTitle">Output formats</div>
                        <div v-for="(i, k) in computeOutFormats" :key="k">
                            <q-btn @click="convert(i)" color="brown" glossy class="convertButton" :disabled="i == 'ico' && !isActiveIco">
                                {{ i }}
                            </q-btn>
                        </div>
                    </div>
                </div>
                <img src="img/parcheminBot.png" class="w-100 parcheminBot">
            </div>
        </div>
    </div>
</template>
<script>
import { defineComponent } from 'vue'
import MediaDisplayer from './MediaDisplayer.vue';
import MonkAnimation from './MonkAnimation.vue';

export default defineComponent({
    components: {
        MediaDisplayer,
        MonkAnimation
    },
    props:{
        muted: Boolean,
        inputFile: {
            type: Object,
            default: () =>{ return null}
        }
    },
    emits: ['error', 'output'],
    data: function () {
        return {
            isConverting: false,
            isActiveIco: false,
            resultExtension: '',

            resultFile: null
        }
    },
    methods: {
        convert(format) {
            try {
                this.resultFile = null;
                this.isConverting = true;
                const fileExt = this.inputFile.path.split('.').slice(-1)[0]
                switch (format) {
                    case 'webp':
                    case 'ico':
                    case 'gif':
                    case 'mp4':
                    case 'webm':
                    case 'jpg':
                        window.ipcRenderer.invoke('file:convert', { file: this.inputFile.path, inputExt: fileExt, outputExt: format }).then((result) => {
                            if (result.error) {
                                this.$emit('error', result.error);
                            } else {
                                this.resultFile = result

                                this.resultExtension = format;
                            }
                            this.isConverting = false;
                            this.$emit('output')
                        }).catch(err => {
                            this.isConverting = false;
                            this.$emit('error', err.message);
                        });
                        break;
                    case 'png':
                        var canvas = this.$refs.imgRenderer;
                        var img = this.$refs.media.getFile();
                        canvas.width = img.width < 300 ? 800 : img.width;
                        canvas.height = img.height < 300 ? 800 : img.height;
                        const context = canvas.getContext('2d');
                        context.clearRect(0, 0, canvas.width, canvas.height);
                        this.drawImageAtMaxSize(context, img, 0, 0, canvas.width, canvas.height);

                        this.resultFile = {data: canvas.toDataURL()}
                        this.isConverting = false;
                        this.$emit('output')
                        break;
                    default:
                        this.isConverting = false;
                }
            } catch (error) {
                this.isConverting = false;
                this.$emit('error', error.message);
            }
        },
        onLoad() {
            this.isActiveIco = this.$refs.media.isSquare()
        },
        drawImageAtMaxSize(ctx, image, x, y, rectW, rectH) {
            var ratio = image.height / image.width;
            var w = rectW;
            var h = rectH;
            if (rectW * ratio > rectH) {
                w = Math.floor(h / ratio);
            } else {
                h = Math.floor(w * ratio);
            }
            ctx.drawImage(image, x + Math.floor((rectW - w) / 2), y + Math.floor((rectH - h) / 2), w, h);
        }
    },
    computed: {
        computeOutFormats() {
            if (this.inputFile == null) return [];
            switch (this.inputFile.path.split('.').slice(-1)[0].toLowerCase()) {
                case 'jpg':
                    return [
                        'webp'
                    ]
                case 'png':
                    return [
                        'webp',
                        'ico'
                    ]
                case 'heic':
                    return [
                        'jpg'
                    ]
                case 'mov':
                case 'avi':
                case 'mp4':
                case 'gif':
                    return ['webm', 'mp4']
                case 'webp':
                    return [
                        'webm'
                    ]
                case 'webm':
                    return ['gif']
                case 'svg':
                    return ['png']
            }
        },
        computeResultFileName() {
            return 'result.' + this.resultExtension;
        }
    }
})
</script>
<style scoped>
.convertLine {
    min-height: 30vh;
    background-color: transparent;
}

.convertButton {
    text-align: center;
    text-transform: uppercase;
    font-size: 2em;
    font-weight: 800;
    margin: 1vh auto;
    width: 50%;
}

.monk {
    height: 35vh;
    width: 100%;
}

.convertButtonList {
    padding: 8vh 2vw 3vh 2vw;
    overflow: hidden;
}

.listContainer {
    overflow: hidden;
    height: fit-content;
    text-align: center;
}

.listTitle {
    position: relative;
    font-size: 5vh;
    position: relative;
    color: rgba(16, 41, 111, 0.58);
    font-family: 'Brush Script MT', cursive;
}

.parcheminBot {
    margin-top: -2vh;
    z-index: 5;
    position: relative;
}

.parchemin {
    width: 100%;
    position: absolute;
    top: 0vh;
    margin: auto;
    left: 0;
    right: 0;
}

.downloadSuccessText {
    margin: auto;
    color: rgb(11, 87, 26);
    font-size: 5vh;
    font-family: 'Brush Script MT', cursive;
    text-shadow: 1px 1px 4px rgba(76, 58, 29, 0.5);
}
</style>