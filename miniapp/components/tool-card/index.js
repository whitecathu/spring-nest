Component({
  properties: {
    tool: {
      type: Object,
      value: {},
    },
    compact: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    handleTap() {
      this.triggerEvent('open', this.properties.tool);
    },
  },
});
