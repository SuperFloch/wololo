<template>
    <div class="p-relative">
        <div class="row convertLine">
            <div ref="input" class="col-10">
                <div class="head text-center">Remove the background of an image</div>
                <MediaDisplayer :src="inputFile.data" v-if="inputFile != null" ref="media"></MediaDisplayer>
            </div>
            <div ref="monk" class="col-2">
                <div class="monk">
                    <MonkAnimation :converting="isConverting" :ready="inputFile != null" :muted="muted"></MonkAnimation>
                </div>
            </div>
        </div>
        <div class="row justify-center q-mt-md">
            <q-btn color="indigo-10" @click="convert" v-show="inputFile != null" glossy>Remove Background</q-btn>
        </div>
        <div class="row resultLine flex-center" v-if="resultFile != null">
            <div class="col-4"></div>
            <div class="col-4">
                <div class="downloadSuccessText">Removal Succeded !</div>
            </div>
            <div class="col-4">
                <img :src="resultFile.data" v-if="resultFile != null">
            </div>
            <div class="col-12" v-if="resultFile != null">
                <a class="q-btn q-btn-item non-selectable no-outline q-btn--standard q-btn--rectangle q-btn--actionable q-focusable q-hoverable glossy bg-green stretch" :href="resultFile.data" :download="'result.png'">Save</a>
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
    emits:['error'],
    data: function(){
        return {
            isConverting: false,
            resultFile: null
        }
    },
    methods:{
        async convert(){
            try{
                this.resultFile = null;
                this.isConverting = true;
                window.ipcRenderer.invoke('img:remove-bg', {img:this.inputFile.path}).then((result)=>{
                    if(result.error){
                        this.$emit('error', result.error)
                    }else{
                        this.resultFile = result
                    }
                    this.isConverting = false;
                })

            }catch(error){
                this.isConverting = false;
                this.$emit('error', error.message);
            }
        }
    }
})
</script>
<style scoped>
.head {
    color: rgb(11, 14, 87);
    font-size: 3em;
    font-family: 'Brush Script MT', cursive;
    text-shadow: 1px 1px 4px rgba(76, 58, 29, 0.5);
}
.downloadSuccessText{
    margin: auto;
    color: rgb(11, 87, 26);
    font-size: 5vh;
    font-family: 'Brush Script MT', cursive;
    text-shadow: 1px 1px 4px rgba(76, 58, 29, 0.5);
}
.media{
    max-width: 40vw;
    max-height: 50vh;
}
</style>