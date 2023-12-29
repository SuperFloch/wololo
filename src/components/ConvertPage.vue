<template>
    <div class="convertPage">
        <div ref="input">
            <q-file filled v-model="currentFile" label="Add +" stack-label @update:model-value="addFile" bg-color="green" class="input"/>
            <MediaDisplayer :src="currentFileSrc" :class="{'hidden' : currentFileSrc == ''}" ref="media" @load="onLoad"></MediaDisplayer>
        </div>
        <div ref="monk">
            <MonkAnimation :converting="isConverting" :ready="currentFileSrc != ''"></MonkAnimation>
        </div>
        <div ref="output">
            <div v-for="(i,k) in computeOutFormats" :key="k">
                <q-btn  @click="convert(i)" color="green" glossy class="convertButton" :disabled="i == 'ico' && !isActiveIco">
                    {{ i }}
                </q-btn>
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
    data: function(){
        return {
            currentFile: null,
            currentFileSrc:'',
            isConverting: false,
            isActiveIco: false
        }
    },
    methods:{
        async addFile(){
            this.currentFileSrc = '';
            const file = this.currentFile;
            const data = await file.arrayBuffer();
            var imgName = "input_"+Math.floor(Math.random() * 500) + "." + file.name.split('.').slice(-1);
            this.currentFileSrc = "workspace/input/"+imgName;
            window.ipcRenderer.send('img:upload', {path: this.currentFileSrc, buffer: data});
        },
        convert(format){
            this.isConverting = true;
            switch(format){
                case 'webp':
                    window.ipcRenderer.invoke('img:convert:webp', {img: this.currentFileSrc}).then((newPath)=>{
                        if(newPath){
                            this.currentFileSrc = '';
                            this.currentFile = null;
                        }
                        this.isConverting = false;
                    });
                    break;
                case 'webm':
                    window.ipcRenderer.invoke('img:convert:webm', {img: this.currentFileSrc}).then((newPath)=>{
                        if(newPath){
                            this.currentFileSrc = '';
                            this.currentFile = null;
                        }
                        this.isConverting = false;
                    });
                    break;
                case 'ico':
                    window.ipcRenderer.invoke('img:convert:ico', {img: this.currentFileSrc}).then((newPath)=>{
                        if(newPath){
                            this.currentFileSrc = '';
                            this.currentFile = null;
                        }
                        this.isConverting = false;
                    });
                    break;
                default:
                    this.isConverting = false;
            }
        },
        onLoad(){
            var img = this.$refs.media.getFile()
            this.isActiveIco = img.width == img.height
        }
    },
    computed: {
        computeOutFormats(){
            if(this.currentFileSrc == '') return [];
            switch(this.currentFileSrc.split('.').slice(-1)[0]){
                case 'jpg':
                return [
                    'webp'
                ]
                case 'png':
                    return [
                        'webp',
                        'ico'
                    ]
                case 'gif':
                case 'webp':
                    return [
                        'webm'
                    ]
            }
        }
    }
})
</script>
<style scoped>
.convertPage{
    display: grid;
    grid-template-columns: repeat(3,1fr);
    height: 80vh;
    background-color: transparent;
}
.convertButton{
    padding: 2vh 3vw;
    text-align: center;
    text-transform: uppercase;
    font-size: 2em;
    font-weight: 800;
    width: 100%;
}

</style>