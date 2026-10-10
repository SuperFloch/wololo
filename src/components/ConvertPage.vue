<template>
    <div class="convertPage">
        <div class="mediaCol">
            <MediaDisplayer v-if="inputFile != null" :src="inputFile.data" ref="media" @load="onLoad"></MediaDisplayer>
            <div v-else class="emptyHint">Load a file to begin</div>
        </div>
        <div class="monkCol">
            <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
            <div class="resultBox" v-if="resultFile != null">
                <div class="aoe-success">Conversion Succeded !</div>
                <q-btn type="a" glossy color="green" class="aoe-btn aoe-save" icon="save" label="Save" :href="resultFile.data" :download="computeResultFileName"></q-btn>
            </div>
        </div>
        <div class="formatCol">
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
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    align-items: start;
}

.emptyHint {
    font-family: var(--aoe-font);
    font-size: 1.6rem;
    color: var(--aoe-gold);
    text-align: center;
    padding: 2rem 0.5rem;
    border: 2px dashed var(--aoe-gold-dark);
    border-radius: 6px;
}

.monkCol {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
}

.resultBox {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.formatCol {
    min-width: 0;
}

.parcheminWrap {
    position: relative;
    overflow: hidden;
    min-height: 8rem;
    padding: 4rem 1.5rem 1rem;
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
    gap: 0.6rem;
}

.listTitle {
    font-family: var(--aoe-font);
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    color: rgba(16, 41, 111, 0.85);
    text-align: center;
}

.convertButton {
    width: 70%;
    min-width: 7rem;
    font-size: 1.4rem;
    text-transform: uppercase;
}

.parcheminBot {
    display: block;
    width: 100%;
    margin-top: -1px;
    position: relative;
    z-index: 2;
}

@media (max-width: 1099px) {
    .convertPage {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .formatCol {
        grid-column: 1 / -1;
        max-width: 24rem;
        width: 100%;
        justify-self: center;
    }
}

@media (max-width: 599px) {
    .convertPage {
        grid-template-columns: minmax(0, 1fr);
    }
}
</style>
