Component({
  properties: {
    tool: {
      type: Object,
      value: {},
    },
    favorite: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    toggleFavorite() {
      this.triggerEvent('favorite', this.properties.tool);
    },
  },
});
