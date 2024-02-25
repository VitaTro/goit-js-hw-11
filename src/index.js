import _throttle from 'lodash.throttle';
import axios from 'axios';
import Notiflix from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';


const APIKEY = '31019872-5203125bb9147bf7b31b034ba'
const gallery = document.querySelector('.gallery');
const searchForm = document.querySelector('#search-form');
const moreLoad = document.querySelector('.load-more');
const btn = document.querySelector('.btn');


let pageNow = 1;
let currentSearchName = '';
let lastPage = 1;
let autoScroll = false;

let lightbox = new SimpleLightbox('.gallery a', {
    captionDelay: 300,
    scrollZoomFactor: false,
});
	
    // код виконує запит до Pixabay для отримання фотографій за заданим ім’ям та сторінкою, 
// обробляє можливі помилки та виводить повідомлення про помилку в консоль або для користувача

const fetchPhotos = async (name, page) => {
    try {
        // key - твій унікальний код доступу API.
        // q - термін, який хочемо знайти (в даному випадку це ті малюнки, які шукатиме користувач) 
        // image_type - тип малюнку. тут хочемо тільки фото (photo)
        // orientation - орієнтація малюнку (horizontal)
        // safesearch - пошук малюнків SFW (Safe For Work). (true)
        const response = await axios.get(`https://pixabay.com/api/?key=${APIKEY}&q=${name}&image_type=photo&orientation=horizontal&safesearch=true&per_page=40&page=${page}`);
        const photos = await response.data;
        checkResults(photos);
    } catch(error) {
        Notiflix.Notify.failure(error.message);
    }
};

// якщо збігів немає, то виводить помилку

const checkResults = (photos) => {
     if (photos.hits.length === 0) { 
            Notiflix.Notify.failure('Sorry, there are no images matching your search query. Please try again.');   
        } else {    
            if (pageNow === 1) {
                Notiflix.Notify.success(`Hooray! We found ${photos.totalHits} images.`);  //виводить повідомлення і кількість знайдених зображень
                currentSearchName = name;
                lastPage = Math.ceil(photos.totalHits / 40);
                if (lastPage > 1 && autoScroll === false) { // якщо більше 1 сторінки і скролл вимкнений, то додає клас
                    moreLoad.classList.add('is-visible')
                };
            }
            renderPhotos(photos);
            lightbox.refresh();
            if (pageNow > 1) {
                renderScroll()
            };
        }   
}

// якщо знаходить фото, то додає нові пункти, які відповідають до фото

const renderPhotos = (photos) => {
    const markup = photos.hits.map((photo) => {
        return `<div class="photo-card">
                    <a href="${photo.largeImageURL}"> 
                        <img src="${photo.webformatURL}" alt="${photo.tags}" data-source="${photo.largeImageURL}" loading="lazy" width="250" height="300"/>
                        <div class="info">
                        <p class="info-item"><span><b>Likes</b></span><span>${photo.likes}</span></p>
                        <p class="info-item"><span><b>Views</b></span><span>${photo.views}</span></p>
                        <p class="info-item"><span><b>Comments</b></span><span>${photo.comments}</span></p>
                        <p class="info-item"><span><b>Downloads</b></span><span>${photo.downloads}</span></p>
                        </div>
                    </a> 
                </div>`
    })
    .join("")
    gallery.innerHTML = gallery.innerHTML + markup;
}

const renderScroll = () => {
    const photoInfo = document.querySelector(".gallery").firstElementChild.getBoundingClientRect();
    const { height: cardHeight } = photoInfo;
    window.scrollBy({
        top: cardHeight * 2,
        behavior: "smooth",
    });
}

// якщо натиснути на пустий пошук, то видасть помилку

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const searchQuery = searchForm.searchQuery.value.trim();
    if(!searchQuery) {
        Notiflix.Notify.info('Please enter a search query.');
        gallery.innerHTML = '';
        moreLoad.classList.remove('is-visible');
    } else {
    pageNow = 1;
    gallery.innerHTML = '';
    fetchPhotos(searchQuery, pageNow);
    moreLoad.classList.remove('is-visible');
    }
});

btn.addEventListener('click', () => {
    if (autoScroll === false) {
        autoScroll = true;
        window.addEventListener('scroll', renderScroll);
        Notiflix.Notify.info('Loading method has been changed to auto.');
    } else {
        autoScroll = false;
        window.removeEventListener('scroll', renderScroll);
        Notiflix.Notify.info('Loading method has been changed to manual.');    
    }  
    btn.classList.toggle('is-active');
    if (pageNow !== lastPage){
        moreLoad.classList.toggle('is-visible');
    } 
})

moreLoad.addEventListener('click', () => {
    pageNow++;
    fetchPhotos(currentSearchName, pageNow); 
       
    if(pageNow === lastPage) {
        Notiflix.Notify.info('Sorry, but you have reached the end of the search results.'); 
        moreLoad.classList.remove('is-visible');
    }  
})

