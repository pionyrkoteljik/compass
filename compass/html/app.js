const { ref, onBeforeUnmount, computed } = Vue;

const app = Vue.createApp({
    data() {
        return {
            isOutCompassChecked: this.initChecked("isOutCompassChecked", true),
            isCompassFollowChecked: this.initChecked("isCompassFollowChecked", true),
            isChangeCompassFPSChecked: this.initChecked("isChangeCompassFPSChecked", "Optimized"),
            isShowCompassChecked: this.initChecked("isShowCompassChecked", true),
            isShowStreetsChecked: this.initChecked("isShowStreetsChecked", true),
            isPointerShowChecked: this.initChecked("isPointerShowChecked", true),
            isDegreesShowChecked: this.initChecked("isDegreesShowChecked", true),
            isCinematicModeChecked: this.initChecked("isCinematicModeChecked", false),
        };
    },
    setup() {
        const progress = ref([
            { loading: false, percentage: 0 },
            { loading: false, percentage: 0 },
            { loading: false, percentage: 0 },
        ]);

        const intervals = ref([null, null, null]);

        function startComputing(id) {
            progress.value[id].loading = true;
            progress.value[id].percentage = 0;

            intervals.value[id] = setInterval(() => {
                progress.value[id].percentage += Math.floor(Math.random() * 8 + 10);
                if (progress.value[id].percentage >= 100) {
                    clearInterval(intervals.value[id]);
                    progress.value[id].loading = false;
                }
            }, 700);
        }

        onBeforeUnmount(() => {
            intervals.value.forEach(clearInterval);
        });

        return {
            framework: {
                plugins: ["LocalStorage", "SessionStorage"],
            },
            tab: ref("hud"),
            splitterModel: ref(20),
            selection: ref([]),
            progress,
            startComputing,
        };
    },
    watch: {
        isOutCompassChecked: 'saveToLocalStorage',
        isCompassFollowChecked: 'saveToLocalStorage',
        isChangeCompassFPSChecked: 'saveToLocalStorage',
        isShowCompassChecked: 'saveToLocalStorage',
        isShowStreetsChecked: 'saveToLocalStorage',
        isPointerShowChecked: 'saveToLocalStorage',
        isDegreesShowChecked: 'saveToLocalStorage',
    },
    methods: {
        initChecked(key, defaultValue) {
            const stored = localStorage.getItem(key);
            return stored === null ? defaultValue : JSON.parse(stored);
        },
        saveToLocalStorage(value, key) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        handleAction(action) {
            $.post(`https://qb-hud/${action}`);
        },
        showOutCompass() { this.handleAction("showOutCompass"); },
        showFollowCompass() { this.handleAction("showFollowCompass"); },
        changeCompassFPS() { this.handleAction("changeCompassFPS"); },
        showCompassBase() { this.handleAction("showCompassBase"); },
        showStreetsNames() { this.handleAction("showStreetsNames"); },
        showPointerIndex() { this.handleAction("showPointerIndex"); },
    },
    mounted() {
        window.addEventListener("message", (event) => {
            if (event.data.event) {
                this[event.data.event] = JSON.parse(event.data.toggle);
            }
        });
    },
});

document.onkeyup = function (data) {
    if (data.key === "Escape") {
        closeMenu();
    }
};

const baseplateHud = {
    data() {
        return {
            show: false,
            street1: "",
            street2: "",
            showCompass: true,
            showStreets: true,
            showPointer: true,
            showDegrees: true,
        };
    },
    destroyed() {
        window.removeEventListener("message", this.listener);
    },
    mounted() {
        this.listener = window.addEventListener("message", (event) => {
            if (event.data.action === "update") {
                this.updateHeading(event.data.value);
            }
            if (event.data.action === "baseplate") {
                this.baseplateHud(event.data);
            }
        });
    },
    methods: {
        baseplateHud(data) {
            this.show = data.show;
            this.street1 = data.street1;
            this.street2 = data.street2;
            this.showCompass = data.showCompass;
            this.showStreets = data.showStreets;
            this.showPointer = data.showPointer;
            this.showDegrees = data.showDegrees;
        },
        updateHeading(value) {
            const heading = value / 2;
            $(".degrees").html(heading);
            document.querySelectorAll("svg").forEach((svg, index) => {
                const viewBox = `${heading - 90} 0 180 ${index === 0 ? 5 : 1.5}`;
                svg.setAttribute("viewBox", viewBox);
            });
        },
    },
};

const app4 = Vue.createApp(baseplateHud);
app4.use(Quasar);
app4.mount("#baseplate-container");
