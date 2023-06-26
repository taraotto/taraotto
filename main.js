/////// FAQs /////// 

const dropDownButtons = document.querySelectorAll('.expandButton')
const expandingSections = document.querySelectorAll('.expandable')

console.log(dropDownButtons);

function dropDownAnswer() {

  let targetExpandableDiv = this.dataset.targetButton;
  // console.log(targetExpandableDiv)
  
  this.classList.toggle('active')
    
  expandingSections.forEach(section => { 
  // console.log(section.dataset.targetMore)

    if (targetExpandableDiv == section.dataset.targetMore) {
      section.classList.toggle('hide-answer')
    } // else { section.classList.add('hide-answer')}
  })
//  this.nextElementSibling.classList.toggle('hide-answer');
//  console.log(this.previousElementSibling);
//  console.log(this.nextElementSibling);
}

dropDownButtons.forEach( button => {
  button.addEventListener('click', dropDownAnswer)
})


/////// Slick slider /////// 

$('.slider-container-testimonials').slick({
	// Setting name: setting-value
  autoplay: true, // Do we want it to autoplay? true or false
	autoplaySpeed: 4000, // How long between each slide when auto-playing
	speed: 2000, // How fast is the transition in milliseconds
	arrows: false, // Do you want to show arrows to trigger each slide
	accessibility: true, // Enables keyboard tabbing and arrow key navigation
	dots: true, // Enables the dots below to show how many slides
	fade: false, // Changes the animate from slide to fade if true
	infinite: true, // When true, means that it will scroll in a circle
	pauseOnHover: true, // When true means the autoplay pauses when hovering
	pauseOnDotsHover: true, // Pauses the autoplay when hovering over the dots
  slidesToShow: 1, // Creating a grid
  slidesToScroll: 1, // How many steps in the grid
  centerMode: false, // Align items in the center
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        arrows: true,
      }
    },
    {
      breakpoint: 768,
      settings: {
        arrows: false,
      }
    }
  ]
});

$('.slider-container-sneakpeak').slick({
	// Setting name: setting-value
  autoplay: false, // Do we want it to autoplay? true or false
	autoplaySpeed: 2000, // How long between each slide when auto-playing
	speed: 500, // How fast is the transition in milliseconds
	arrows: true, // Do you want to show arrows to trigger each slide
	accessibility: true, // Enables keyboard tabbing and arrow key navigation
	dots: false, // Enables the dots below to show how many slides
	fade: false, // Changes the animate from slide to fade if true
	infinite: true, // When true, means that it will scroll in a circle
	pauseOnHover: false, // When true means the autoplay pauses when hovering
	pauseOnDotsHover: true, // Pauses the autoplay when hovering over the dots
  slidesToShow: 1, // Creating a grid
  slidesToScroll: 1, // How many steps in the grid
  centerMode: false, // Align items in the center
  responsive: [
    {
      breakpoint: 1024,
      settings: {
        arrows: true,
      }
    },
    {
      breakpoint: 768,
      settings: {
        arrows: false,
      }
    }
  ]
});


/////// Mobile menue /////// 

const burgerButton = document.querySelector('.burger')
const mobileMenu = document.querySelector('.mobile-menu')
const menuLogo = document.querySelector('.menu-logo')

function openMobileMenu() {
  mobileMenu.classList.toggle('mobile-menu-hidden');
  this.classList.toggle('active');
}

burgerButton.addEventListener('click', openMobileMenu);

/////// Animate on scroll /////// 
AOS.init();


/////// Portfolio filter /////// 
const gallery_buttons = document.querySelectorAll('#portfolio-filter a')
    const gallery_items = document.querySelectorAll('#portfolio-grid .gallery-item')
            
    // Step #2. Start our filter function. In this case we called it filter gallery in case we might want to filter other things on the page as well. Also we have an (e) for the function parameter. This is the event (or thing that triggered the function) and we can pass data to function through that parameter.
    function filterGallery(e) {
    // Step #3. Because we were using <a> elements, we want to make sure that it doesn't link anywhere else. We can skip this step if we are using a different element.
        e.preventDefault();
        // make this <a> class active and remove class 'active' from any other <a> elements
        // Step #13. Let's remove it from the others that we didn't click on
        gallery_buttons.forEach(button => {
            button.classList.remove('active')
        });
        // Step #12. At this stage we have a fully functional filter gallery
        // but lets add just a little fancyness to the filter.
        // When we click on a button, let's add a class to jump it up a notch
        this.classList.add('active');
        
        // Step #5. Making sure it's all working good so far
        console.log(this.dataset.filter)
        // Step #6. Add a variable that will pull the name of the category from this link
        let filterVal = this.dataset.filter;

        // Step #7. We need to loop over the gallery items 
        gallery_items.forEach(item => {
            // Step #8. Because we want a reset, lets add an if statement to see if we have clicked the all button (basically a reset button)
            if (filterVal == 'All') {
                // If they did, then remove hidden
                item.classList.remove('hidden');
            } 
            // Step #9. If they clicked on a different button instead
            else {
                // Step #10. We need to see if our filterVal matches something.
                // In this case we are seeing if the image's class list contains our filterVal  
                if (item.classList.contains(filterVal)) {
                    // If it does, then remove the hidden class
                    item.classList.remove('hidden'); // show those that do have the filter
                } else {
                    // Step #11. If it doesn't, then add it on
                    item.classList.add('hidden'); // hide those that don't have the filter
                }
            };
            
        })
    }
    // Step #4. Let's add an event listener for each of our buttons
    gallery_buttons.forEach(button => {
        button.addEventListener('click', filterGallery)
    })



/////// Search bar /////// 
const searchBox = document.querySelector("#searchBox");
const searchLink = document.querySelector(".searchButton")

function updateSearch() {
    var searchValue = searchBox.value;
    searchLink.href = `/search?${searchValue}`
}
function searchNow(e) {
    console.log(e)
        if (e.key === 'Enter' || e.keyCode === 13) {
        // Do something
        var searchValue = searchBox.value;
        window.location = "/search?" + searchValue;
        }
    }

searchBox.addEventListener("change", updateSearch)
searchBox.addEventListener("keyup", searchNow)