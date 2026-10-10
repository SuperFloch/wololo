<template>
    <div class="convertPage">
        <div class="mediaArea aoe-media">
            <MediaDisplayer v-if="inputFile != null" :src="inputFile.data" ref="media" fit @load="onLoad"></MediaDisplayer>
            <div v-else class="aoe-empty">Load a file to begin</div>
        </div>
        <div class="monkArea">
            <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
            <div class="resultBox" v-if="resultFile != null">
                <div class="aoe-success">Conversion Succeded !</div>
                <q-btn type="a" glossy color="green" class="aoe-btn aoe-save" icon="save" label="Save" :href="resultFile.data" :download="computeResultFileName"></q-btn>
            </div>
        </div>
        <div class="formatArea">
            <canvas ref="imgRenderer" hidden></canvas>
            <div class="parcheminWrap">
                <img src="img/parcheminBg.png" class="parchemin" alt="">
                <div class="listContainer">
                    <div class="listTitle">Output formats</div>
                    <q-btn v-for="(i, k) in computeOutFormats" :key="k" @click="convert(i)" color="brown" glossy class="convertButton aoe-btn" :disable="i == 'ico' && !isActiveIco">
                        {{ i }}
                    </q-btn>
                </div>
            </div>
            <img src="img/parcheminBot.png" class="parcheminBot" alt="">
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
                default:
                    return []
            }
        },
        computeResultFileName() {
            return 'result.' + this.resultExtension;
        }
    }
})
</script>
<style scoped>
.convertPage {
    flex: 1 1 0;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 0.8fr);
    grid-template-areas: "media monk formats";
    gap: 0.75rem;
    align-items: stretch;
}

.mediaArea {
    grid-area: media;
}

.monkArea {
    grid-area: monk;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-width: 0;
    width: clamp(7rem, 16vw, 12rem);
}

.resultBox {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
}

.formatArea {
    grid-area: formats;
    min-width: 0;
    min-height: 0;
    align-self: center;
}

.parcheminWrap {
    position: relative;
    overflow: hidden;
    padding: clamp(2.5rem, 7vh, 4rem) 1rem 0.5rem;
}

.parchemin {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: auto;
    z-index: 0;
}

.listContainer {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
}

.listTitle {
    font-family: var(--aoe-font);
    font-size: 1.7rem;
    color: rgba(16, 41, 111, 0.85);
    text-align: center;
}

.convertButton {
    width: 70%;
    min-width: 5rem;
    font-size: 1.2rem;
    text-transform: uppercase;
}

.parcheminBot {
    display: block;
    width: 100%;
    margin-top: -1px;
    position: relative;
    z-index: 2;
}

/* Etroit : le media en haut, le moine et les formats cote a cote en dessous */
@media (max-width: 639px) {
    .convertPage {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr) auto;
        grid-template-areas: "media media" "monk formats";
    }

    .monkArea {
        width: auto;
        flex-direction: row;
        flex-wrap: wrap;
    }

    .formatArea {
        justify-self: center;
        width: min(100%, 13rem);
    }
}
</style>
