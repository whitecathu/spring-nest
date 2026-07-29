Component({
  properties: {
    tool: { type: Object, value: {} },
    mode: { type: String, value: 'grid' },
    blob: { type: String, value: '' },
  },
  methods: {
    onTap() {
      this.triggerEvent('open', { tool: this.data.tool });
    },
  },
});
