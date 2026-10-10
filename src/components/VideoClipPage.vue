<template>
    <div class="clipPage">
        <div class="workRow">
            <div class="mediaCol">
                <MediaDisplayer :src="inputFile.data" v-if="inputFile != null" ref="media" :autoplay="false" :loop="true" :start="start" :end="end"></MediaDisplayer>
                <div v-else class="emptyHint">Load a video to begin</div>
            </div>
            <div class="monkCol">
                <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
            </div>
        </div>
        <div class="gauge" ref="gauge" v-show="inputFile != null">
            <div class="bar" :style="{'left': start+'%', 'width': (end-start)+'%'}"></div>
            <div class="slider" :style="{'left': start+'%'}" @pointerdown="grab" @pointermove="onDragStart" @pointerup="release" @pointercancel="release"></div>
            <div class="slider" :style="{'left': end+'%'}" @pointerdown="grab" @pointermove="onDragEnd" @pointerup="release" @pointercancel="release"></div>
        </div>
        <div class="actionRow">
            <q-btn color="indigo-10" class="aoe-btn" glossy @click="clip" :disable="inputFile === null || isConverting" :loading="isConverting" label="Clip"></q-btn>
        </div>
        <div class="resultBox" v-if="resultFile != null">
            <div class="aoe-success">Clip Succeded !</div>
            <q-btn type="a" glossy color="green" class="aoe-btn aoe-save" icon="save" label="Save" :href="resultFile.data" :download="resultFile.path.split('/').slice(-1)[0]"></q-btn>
        </div>
    </div>
</template>
<script>
import MediaDisplayer from './MediaDisplayer.vue';
import MonkAnimation from './MonkAnimation.vue';
export default {
    data: function(){
        return {
            isConverting: false,
            start: 0,
            end: 100,
            resultFile: null
        }
    },
    props:{
        muted: Boolean,
        inputFile: {
            type: Object,
            default: () =>{ return null}
        }
    },
    emits:['error', 'output'],
    components:{
        MediaDisplayer,
        MonkAnimation
    },
    methods:{
        grab(e){
            e.currentTarget.setPointerCapture(e.pointerId)
        },
        release(e){
            if(e.currentTarget.hasPointerCapture(e.pointerId)){
                e.currentTarget.releasePointerCapture(e.pointerId)
            }
        },
        // Position du pointeur sur la jauge, en pourcentage (0-100)
        gaugePercent(e){
            const rect = this.$refs.gauge.getBoundingClientRect()
            return (e.clientX - rect.left) / rect.width * 100
        },
        onDragStart(e){
            if(!e.currentTarget.hasPointerCapture(e.pointerId)) return
            this.start = Math.min(Math.max(this.gaugePercent(e), 0), this.end - 1)
            this.$refs.media.setTime(this.start)
        },
        onDragEnd(e){
            if(!e.currentTarget.hasPointerCapture(e.pointerId)) return
            this.end = Math.max(Math.min(this.gaugePercent(e), 100), this.start + 1)
            this.$refs.media.setTime(this.end)
        },
        async clip(){
            this.resultFile = null
            this.isConverting = true
            const startTime = this.start / 100 * this.$refs.media.getDuration()
            const duration =  Math.abs(startTime - this.end / 100 * this.$refs.media.getDuration())
            window.ipcRenderer.invoke('video:clip', {video: this.inputFile.path, startTime, duration}).then((result)=>{
                if(result.error){
                    this.$emit('error', result.error);
                }else{
                    this.resultFile = result;
                    this.$emit('output')
                }
                this.isConverting = false;
            }).catch(err =>{
                this.isConverting = false;
                this.$emit('error', err.message);
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

.mediaCol {
    flex: 1 1 16rem;
    min-width: 0;
}

.monkCol {
    flex: 0 1 10rem;
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

.gauge {
    position: relative;
    width: min(90%, 40rem);
    height: 10px;
    margin: 1.5rem auto 1rem;
    background: linear-gradient(180deg, rgb(114, 114, 114) 17%, rgb(185, 185, 185) 55%, rgb(139, 138, 138) 100%);
    border: 1px solid var(--aoe-gold-dark);
    border-radius: 6px;
}

.bar {
    position: absolute;
    top: 0;
    height: 100%;
    background: linear-gradient(180deg, rgb(66, 166, 200) 17%, rgb(58, 70, 249) 55%, rgb(66, 166, 200) 100%);
}

.slider {
    position: absolute;
    top: 50%;
    width: 22px;
    height: 22px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, rgba(230, 197, 101, 1) 0%, rgb(95, 81, 44) 100%);
    border: 2px solid var(--aoe-gold-dark);
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
    cursor: grab;
    touch-action: none;
}

.actionRow {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}

.resultBox {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 2px groove var(--aoe-gold-dark);
}

.resultBox .aoe-save {
    max-width: 24rem;
}
</style>
