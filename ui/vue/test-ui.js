import AppFactory from '/bb-vue/AppFactory.js'

// prettier-ignore
import { css, getGlobal, html, setGlobal, sleep } from '/bb-vue/lib.js'

// ascii dep
// import asciichart from '/bb-vue/misc-examples/asciichart-lib.js'

/** @param { import("~/ns").NS } ns */
export async function main(ns) {
    try {
        await new AppFactory(ns).mount({
            config: { id: 'test-app' },
            rootComponent: MyAppComponent,
        })
    } catch (error) {
        console.error(error)
        ns.tprint(error.toString())
        ns.exit()
    }
}

const MyAppComponent = {
    name: 'test',
    inject: ['appShutdown'],
    template: html`
    <bbv-win class="__CMP_NAME__" title="Test Chart" no-pad start-width="50%">
        <pre>
          Successful Hacks : {{ this.successHacks }}
          Failed Hacks     : {{ this.failedHacks }}
          Batches Deployed : {{ this.batchesDeployed }}</pre>
      <template #actions>
        <bbv-button @click="appShutdown">🛑 Shutdown</bbv-button>
      </template>
    </bbv-win>
  `,

    data() {
        return {
            bus: null,
            chartHistory: [],
            eventBuffer: [],
            successHacks: 0,
            failedHacks: 0,
            batchesDeployed: 0,
            // pauseEvents: false,
        }
    },

    computed: {
        successHacksOutput() {
            // if (this.chartHistory.length < 1) return ''
            return this.successHacks
        },
    },

    // watch: {
    //     pauseEvents(newVal) {
    //         if (newVal !== true) {
    //             this.$refs.chartDisplay?.scrollTo({ left: 0, behavior: 'smooth' })
    //             this.flushBuffer()
    //         }
    //     },
    // },

    mounted() {
        this.bus = getGlobal('testBus')
        if (!this.bus) {
            this.bus = getGlobal('Mitt').createBus()
            setGlobal('testBus', this.bus)
        }
        this.bus.on('testEmitter', this.handleBusEvent)
    },

    methods: {
        handleBusEvent(data) {
            //add the new data if it  exitsts to the history
            if     (data.value == "goodHack") this.successHacks++;
            else if(data.value == "badHack") this.failedHacks++; 
            else if(data.value == "batchDeployed") this.batchesDeployed++; 
        },
        async flushBuffer() {
            for (let i = this.eventBuffer.length - 1; i >= 0; i--) {
                let entry = this.eventBuffer[i]
                if (!entry) return
                this.bus.emit('testEmitter', entry)
                this.eventBuffer.pop()
                await sleep(10)
            }
        },
    },

    scss: css`
    @font-face {
      font-family: 'FreeMono';
      src: url('https://gumballcdn.netlify.app/FreeMono.woff2') format('woff2');
    }

    .__CMP_NAME__ {
      .win_content {
        display: flex;
        align-items: center;
      }

      .chartBg {
        display: flex;
        align-items: center;
        width: 100%;
        min-height: 350px;
        background-color: var(--bbvHackerDarkBgColor);
        padding: 30px 0;
      }

      .chartDisplay {
        @include bbv-scrollbar;

        overflow: auto;
        padding: 30px 0;
        font-family: 'FreeMono';
        cursor: default;
        user-select: none;
      }
    }
  `,
}
