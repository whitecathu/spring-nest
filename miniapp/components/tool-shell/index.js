Component({
  properties: {
    title: { type: String, value: '' },
    desc: { type: String, value: '' },
    icon: { type: String, value: '' },
    bg: { type: String, value: '#c0edd1' },
    color: { type: String, value: '#274f3a' },
    favorite: { type: Boolean, value: false },
    studyMode: { type: Boolean, value: false },
  },
  methods: {
    onBack() {
      this.triggerEvent('back');
    },
    onToggleFavorite() {
      this.triggerEvent('togglefavorite');
    },
  },
});
