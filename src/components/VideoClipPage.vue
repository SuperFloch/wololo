<template>
    <div class="aoe-page">
        <div class="aoe-work">
            <div class="aoe-media">
                <MediaDisplayer :src="inputFile.data" v-if="inputFile != null" ref="media" fit :autoplay="false" :loop="true" :start="start" :end="end"></MediaDisplayer>
                <div v-else class="aoe-empty">Load a video to begin</div>
            </div>
            <div class="aoe-monk">
                <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
            </div>
        </div>
        <div class="gauge" ref="gauge" v-show="inputFile != null">
            <div class="bar" :style="{'left': start+'%', 'width': (end-start)+'%'}"></div>
            <div class="slider" :style="{'left': start+'%'}" @pointerdown="grab" @pointermove="onDragStart" @pointerup="release" @pointercancel="release"></div>
            <div class="slider" :style="{'left': end+'%'}" @pointerdown="grab" @pointermove="onDragEnd" @pointerup="release" @pointercancel="release"></div>
        </div>
        <div class="aoe-actions">
            <q-btn color="indigo-10" class="aoe-btn" glossy @click="clip" :disable="inputFile === null || isConverting" :loading="isConverting" label="Clip"></q-btn>
            <template v-if="resultFile != null">
                <div class="aoe-success">Clip Succeded !</div>
                <q-btn type="a" glossy color="green" class="aoe-btn aoe-save" icon="save" label="Save" :href="resultFile.data" :download="resultFile.path.split('/').slice(-1)[0]"></q-btn>
            </template>
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
.gauge {
    flex: 0 0 auto;
    position: relative;
    width: min(90%, 50rem);
    height: 10px;
    margin: 0.6rem auto;
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
</style>
