// Constantes de configuración (A completar por el usuario)
const GOOGLE_API_KEY = "AIzaSyD-MEOPGU4-oGwp3Tpm1x0BcOlfXusUW54";
const PLACE_ID = "ChIJAQjYUaMvo5URgcE2lYMf0Gc";

function initGoogleReviews() {
    if (!GOOGLE_API_KEY || !PLACE_ID) {
        console.warn("Falta configurar GOOGLE_API_KEY o PLACE_ID para cargar las reseñas.");
        const container = document.getElementById("google-reviews-container");
        if (container) {
            container.innerHTML =
                "<p class='col-span-full text-center text-sm text-black/50 dark:text-white/50 py-8'>Las reseñas se mostrarán aquí una vez que configures tu API Key y Place ID.</p>";
        }
        return;
    }

    // Inyectar el script de Google Maps dinámicamente si no existe
    if (!window.google || !window.google.maps) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&callback=loadPlacesData`;
        script.async = true;
        script.defer = true;

        // Asignar el callback global
        window.loadPlacesData = fetchAndRenderReviews;

        document.head.appendChild(script);
    } else {
        fetchAndRenderReviews();
    }
}

function fetchAndRenderReviews() {
    const container = document.getElementById("google-reviews-container");
    if (!container) return;

    // Se necesita un elemento div invisible para que el PlacesService funcione
    const dummyDiv = document.createElement("div");
    const service = new google.maps.places.PlacesService(dummyDiv);

    const request = {
        placeId: PLACE_ID,
        fields: ["name", "rating", "user_ratings_total", "reviews"]
    };

    service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place.reviews) {
            renderReviews(place.reviews, place.rating, place.user_ratings_total);
        } else {
            console.error("Error al obtener las reseñas de Google: ", status);
            container.innerHTML = "<p class='col-span-full text-center text-sm text-black/50 dark:text-white/50'>No se pudieron cargar las reseñas en este momento.</p>";
        }
    });
}

function renderReviews(reviews, rating, totalRatings) {
    const container = document.getElementById("google-reviews-container");
    const header = document.getElementById("google-reviews-header");

    if (header) {
        header.innerHTML = `
            <div class="flex items-center justify-center gap-2 mb-1">
                <span class="text-4xl font-bold text-black dark:text-white">${rating}</span>
                <div class="flex text-[#f1c40f] text-2xl tracking-widest">
                    ${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}
                </div>
            </div>
            <p class="text-sm text-black/55 dark:text-white/55">Basado en ${totalRatings} opiniones en Google</p>
        `;
    }

    // Mostrar solo las reseñas con 4 o 5 estrellas, y tomar hasta 3
    const bestReviews = reviews.filter(r => r.rating >= 4).slice(0, 3);

    if (bestReviews.length === 0) {
        container.innerHTML = "<p class='col-span-full text-center text-sm text-black/50 dark:text-white/50'>Aún no hay reseñas para mostrar.</p>";
        return;
    }

    container.innerHTML = bestReviews.map(review => `
        <div class="review-card bg-white dark:bg-zinc-900 p-6 flex flex-col h-full border border-black/5 dark:border-white/5">
            <div class="flex items-center gap-4 mb-4">
                <img src="${review.profile_photo_url}" alt="${review.author_name}" class="w-12 h-12 rounded-full object-cover">
                <div>
                    <p class="font-semibold text-sm text-black dark:text-white">${review.author_name}</p>
                    <div class="flex text-[#f1c40f] text-xs mt-0.5">
                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                    </div>
                </div>
            </div>
            <p class="text-sm text-black/70 dark:text-white/70 italic flex-grow leading-relaxed">"${review.text}"</p>
            <p class="text-xs text-black/40 dark:text-white/40 mt-5">${review.relative_time_description}</p>
        </div>
    `).join("");
}

document.addEventListener("DOMContentLoaded", initGoogleReviews);
