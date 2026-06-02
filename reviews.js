const GOOGLE_API_KEY = "AIzaSyD-MEOPGU4-oGwp3Tpm1x0BcOlfXusUW54";
const PLACE_ID = "ChIJAQjYUaMvo5URgcE2lYMf0Gc";

function initGoogleReviews() {
    if (!GOOGLE_API_KEY || !PLACE_ID) return;

    if (!window.google || !window.google.maps) {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&callback=loadPlacesData`;
        script.async = true;
        script.defer = true;
        window.loadPlacesData = fetchAndRenderReviews;
        document.head.appendChild(script);
    } else {
        fetchAndRenderReviews();
    }
}

function fetchAndRenderReviews() {
    const container = document.getElementById("google-reviews-container");
    if (!container) return;

    const dummyDiv = document.createElement("div");
    const service = new google.maps.places.PlacesService(dummyDiv);

    service.getDetails(
        { placeId: PLACE_ID, fields: ["name", "rating", "user_ratings_total", "reviews"] },
        (place, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && place.reviews) {
                renderReviews(place.reviews, place.rating, place.user_ratings_total);
            } else {
                container.innerHTML = "<p class='col-span-full text-center text-sm text-black/50 dark:text-white/50 py-8'>No se pudieron cargar las reseñas.</p>";
            }
        }
    );
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

    const bestReviews = reviews.filter(r => r.rating >= 4);

    if (bestReviews.length === 0) {
        container.innerHTML = "<p class='col-span-full text-center text-sm text-black/50 dark:text-white/50 py-8'>Aún no hay reseñas para mostrar.</p>";
        return;
    }

    // Reemplazar el grid por un contenedor de carrusel
    container.className = "relative overflow-hidden";
    container.innerHTML = `
        <div id="reviews-track" class="flex transition-transform duration-700 ease-in-out">
            ${bestReviews.map((review, i) => `
                <div class="review-slide min-w-full sm:min-w-[50%] lg:min-w-[33.333%] px-2 box-border flex-shrink-0">
                    <div class="review-card bg-white dark:bg-zinc-900 p-6 flex flex-col h-full border border-black/5 dark:border-white/5 rounded-3xl">
                        <div class="flex items-center gap-3 mb-4">
                            <img src="${review.profile_photo_url}" 
                                 alt="${review.author_name}" 
                                 class="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                 onerror="this.style.display='none'">
                            <div>
                                <p class="font-semibold text-sm text-black dark:text-white leading-tight">${review.author_name}</p>
                                <div class="flex text-[#f1c40f] text-xs mt-0.5">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                            </div>
                        </div>
                        <p class="text-sm text-black/70 dark:text-white/70 flex-grow leading-relaxed">"${review.text}"</p>
                        <p class="text-xs text-black/40 dark:text-white/40 mt-4">${review.relative_time_description}</p>
                    </div>
                </div>
            `).join("")}
        </div>

        <!-- Dots -->
<div id="reviews-dots" class="flex justify-center gap-2 mt-6">
    ${Array.from({
        length: Math.max(
            1,
            bestReviews.length -
            (
                window.innerWidth >= 1024 ? 3 :
                window.innerWidth >= 640 ? 2 : 1
            ) + 1
        )
    }, (_, i) => `
        <button
            onclick="goToReview(${i})"
            class="review-dot w-2 h-2 rounded-full transition-all duration-300 ${
                i === 0
                    ? 'bg-black dark:bg-white w-4'
                    : 'bg-black/20 dark:bg-white/20'
            }"
            aria-label="Página ${i + 1}">
        </button>
    `).join("")}
</div>
    `;

    iniciarCarruselReviews(bestReviews.length);
}

let reviewActual = 0;
let reviewInterval = null;
let reviewTotal = 0;

function iniciarCarruselReviews(total) {
    reviewTotal = total;
    reviewActual = 0;
    clearInterval(reviewInterval);
    reviewInterval = setInterval(() => {
        reviewActual = (reviewActual + 1) % reviewTotal;
        moverCarruselReviews();
    }, 5000);

    // Swipe en mobile
    const track = document.getElementById("reviews-track");
    if (!track) return;

    let startX = 0;
    track.addEventListener("touchstart", e => { startX = e.changedTouches[0].screenX; }, { passive: true });
    track.addEventListener("touchend", e => {
        const diff = startX - e.changedTouches[0].screenX;
        if (diff > 50) { reviewActual = (reviewActual + 1) % reviewTotal; moverCarruselReviews(); }
        if (diff < -50) { reviewActual = (reviewActual - 1 + reviewTotal) % reviewTotal; moverCarruselReviews(); }
    }, { passive: true });
}

function goToReview(index) {
    reviewActual = index;
    moverCarruselReviews();
    clearInterval(reviewInterval);
    reviewInterval = setInterval(() => {
        reviewActual = (reviewActual + 1) % reviewTotal;
        moverCarruselReviews();
    }, 5000);
}

function moverCarruselReviews() {
    const track = document.getElementById("reviews-track");
    const dots = document.querySelectorAll(".review-dot");

    if (!track) return;

    let slidesVisibles = 1;

    if (window.innerWidth >= 1024) {
        slidesVisibles = 3;
    } else if (window.innerWidth >= 640) {
        slidesVisibles = 2;
    }

    const maxSlide = Math.max(0, reviewTotal - slidesVisibles);

    if (reviewActual > maxSlide) {
        reviewActual = maxSlide;
    }

    const porcentaje = (100 / slidesVisibles) * reviewActual;

    track.style.transform = `translateX(-${porcentaje}%)`;

    dots.forEach((dot, i) => {
const activo = i === Math.min(reviewActual, maxSlide);

        dot.className = `review-dot rounded-full transition-all duration-300 ${
            activo
                ? 'bg-black dark:bg-white w-4 h-2'
                : 'bg-black/20 dark:bg-white/20 w-2 h-2'
        }`;
    });
}

document.addEventListener("DOMContentLoaded", initGoogleReviews);
