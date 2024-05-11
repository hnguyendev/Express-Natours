
export const displayMap = (locations) => {
    mapboxgl.accessToken='pk.eyJ1Ijoia2lybzA2MDgiLCJhIjoiY2xpMTlnODl6MGV5YjNjbzRlNm9pc2g2dCJ9.Nwvi1UqhxDRdTVLlJfgBDQ';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/kiro0608/cli19zvr302g801qya2l62ma2',
        scrollZoom: false
        // center: [-118.191288, 34.073352],
        // zoom: 10,
        // interactive: false
    });
    
    const bounds = new mapboxgl.LngLatBounds();
    
    locations.forEach(loc => {
        const el = document.createElement('div');
        el.className = 'marker';
    
        // Add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);
    
        // Add popup
        new mapboxgl.Popup({
            offset: 30
        })
            .setLngLat(loc.coordinates)
            .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
            .addTo(map);
        
        
        bounds.extend(loc.coordinates);
    });
    
    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100
        }
    });
}

