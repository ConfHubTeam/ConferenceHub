exports.up = (pgm) => {
  pgm.addColumns('places', {
    matterport_link: {
      type: 'varchar(500)',
      notNull: false,
      comment: 'Matterport 3D tour link for immersive space visualization'
    }
  });

  // Add index for better query performance if needed
  pgm.createIndex('places', 'matterport_link');
};

exports.down = (pgm) => {
  pgm.dropIndex('places', 'matterport_link');
  pgm.dropColumns('places', 'matterport_link');
};
