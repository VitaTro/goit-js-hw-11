import axios from 'axios';  //для асинхронних http-запитів, корисна для CRUD
import Notiflix from 'notiflix';   // щоб збоку виводились повідомлення 
import SimpleLightbox from 'simplelightbox';  // щоб галерея з фото збільшувалась
import 'simplelightbox/dist/simple-lightbox.min.css'; // css до збільшеної галереї
import _throttle from 'lodash.throttle';  // дозволяє блокувати виклики

const APIKEY = '42470920-96122d8b93373a33cc6d0556a';
const gallery = document.querySelector('.gallery');
const searchForm = document.querySelector('#search-form');
const moreLoad = document.querySelector('.load-more');
const btn = document.querySelector('.btn');

let pageNow = 1;
let currentSearchName = '';
let lastPage = 1;
let searchQuery = '';
let autoScroll = false;


let lightbox = new SimpleLightbox('.gallery a', {
    captionDelay: 300,
    scrollZoomFactor: false,
  });

    // код виконує запит до Pixabay для отримання фотографій за заданим ім’ям та сторінкою, 
// обробляє можливі помилки та виводить повідомлення про помилку в консоль або для користувача

const fetchPhotos = async (name, page) => {
    try {
//         // key - твій унікальний код доступу API.
//         // q - термін, який хочемо знайти (в даному випадку це ті малюнки, які шукатиме користувач) 
//         // image_type - тип малюнку. тут хочемо тільки фото (photo)
//         // orientation - орієнтація малюнку (horizontal)
//         // safesearch - пошук малюнків SFW (Safe For Work). (true)
       const response = await axios(`https://pixabay.com/api/?key=${APIKEY}&q=${name}&image_type=photo&orientation=horizontal&safesearch=true&per_page=40&page=${page}`);
    const photos = await response.data;
    checkResults(photos);
  } catch (error) {
    Notiflix.Notify.failure(error.message);
  }
};
// function getData(data) {
//     let searchParams = new URLSearchParams ({
//         key: APIKEY,
//         q: data,
//         image_type: 'photo',
//         orientation:'horizontal',
//         safesearch: 'true',
//         per_page: 40,
//         page: page,
//     });
//     let url = `https://pixabay.com/api/?${searchParams}`;
// }

// якщо збігів немає, то виводить помилку

const checkResults = (photos) => {
     if (photos.hits.length === 0) { 
            Notiflix.Notify.failure('Sorry, there are no images matching your search query. Please try again.');   
        } else {    
            if (pageNow === 1) {
                Notiflix.Notify.success(`Hooray! We found ${photos.totalHits} images.`);  //виводить повідомлення і кількість знайдених зображень
                // currentSearchName = photos.hits[0].tags;
                const searchQuery = searchForm.searchQuery.value.trim();
                currentSearchName = searchQuery;  //ГОЛОВНА ПОМИЛКА, яка не давала мені одне ім'я в пошуку
                lastPage = Math.ceil(photos.totalHits / 40);
                if (lastPage > 1 && autoScroll === false) { // якщо більше 1 сторінки і скролл вимкнений, то додає клас
                  moreLoad.classList.add('is-visible')
              };
            }
            renderPhotos(photos);
           lightbox.refresh();
           if(pageNow > 1) {
            renderScroll();
           }
           if (pageNow === lastPage) {
            Notiflix.Notify.info("We're sorry, but you've reached the end of search results."); 
            moreLoad.classList.remove("is-visible");
          }
        }   
};

// якщо знаходить фото, то додає нові пункти, які відповідають до фото

const renderPhotos = (photos) => {
    const markup = photos.hits
      .map((photo) => {
    return `
        <div class="photo-card">
          <a href="${photo.largeImageURL}">
            <img src="${photo.webformatURL}" alt="${photo.tags}" 
            data-source="${photo.largeImageURL}" 
            loading="lazy" width="250" height="300"/>
            <div class="info">
              <p class="info-item"><span><b>Likes</b></span><span>${photo.likes}</span></p>
              <p class="info-item"><span><b>Views</b></span><span>${photo.views}</span></p>
              <p class="info-item"><span><b>Comments</b></span><span>${photo.comments}</span></p>
              <p class="info-item"><span><b>Downloads</b></span><span>${photo.downloads}</span></p>
            </div>
          </a>
        </div>
      `})
      .join('');
  
    gallery.innerHTML += markup;
  };

const renderScroll = () => {
    const photoInfo = document.querySelector(".gallery").firstElementChild.getBoundingClientRect();
    const { height: cardHeight } = photoInfo;
    window.scrollBy({
        top: cardHeight * 2,
        behavior: "smooth",
    });
};


// якщо натиснути на пустий пошук, то видасть помилку

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    searchQuery = searchForm.searchQuery.value.trim();
    if(!searchQuery) {
      Notiflix.Notify.info('Please enter a search query.');
      gallery.innerHTML = '';
      pageNow = 1;
    }else if(searchQuery.length < 3) {
      Notiflix.Notify.info('Please enter a search query with at least 3 letters.');
  } else {
  pageNow = 1;
  gallery.innerHTML = '';
  currentSearchName = searchQuery;
  fetchPhotos(searchQuery, pageNow);
  }
});

btn.addEventListener('click', () => {
  if (autoScroll === false) {
      autoScroll = true;
      window.addEventListener('scroll', infinityScroll);
      Notiflix.Notify.info('Loading method has been changed to auto.');
  } else {
      autoScroll = false;
      window.removeEventListener('scroll', infinityScroll);
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

const infinityScroll = _throttle(() => {
  if(window.scrollY + window.innerHeight >= document.documentElement.scrollHeight){
      if (actualPage < lastPage) {
          actualPage++;
          fetchPhotos(currentSearchName, actualPage);     
          if (actualPage === lastPage) {
              Notiflix.Notify.info("We're sorry, but you've reached the end of search results."); 
              btnMore.classList.remove("is-visible");
          }  
      } 
  }
}, 300);
 