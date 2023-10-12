const apiKey = "5430110c926ffb21dc3ebe2719ee57ea";

// Function to search for a movie by name
const searchForMovie = async (movieName) => {
  //const apiKey = "5430110c926ffb21dc3ebe2719ee57ea"; 
  const tmdbUrl = "https://api.themoviedb.org/3/search/movie";

  const response = await fetch(`${tmdbUrl}?api_key=${apiKey}&query=${movieName}`);
  const data = await response.json();
  
  if (data.results.length > 0) {
      return data.results[0]; // Return the first result if available
  }

  return null;
};

// Function to get genre names from genre IDs
const getGenreNames = async (genreIds) => {
  //const apiKey = "5430110c926ffb21dc3ebe2719ee57ea"; 
  const genreUrl = "https://api.themoviedb.org/3/genre/movie/list";

  const response = await fetch(`${genreUrl}?api_key=${apiKey}`);
  const data = await response.json();
  
  const genreNames = genreIds.map(id => {
      const genre = data.genres.find(genre => genre.id === id);
      return genre ? genre.name : "";
  });

  return genreNames;
};

// Function to get movie recommendations based on genre and language
const getMovieRecommendations = async (genreIds, language) => {
  //const apiKey = "5430110c926ffb21dc3ebe2719ee57ea"; 
  const tmdbUrl = "https://api.themoviedb.org/3/discover/movie";

  const genreQuery = genreIds.map(id => `with_genres=${id}`).join("&");
  const languageQuery = `with_original_language=${language}`;
  const voteAverageQuery = "vote_count.gte=50"; // Minimum vote count to get quality recommendations

  const response = await fetch(`${tmdbUrl}?api_key=${apiKey}&${genreQuery}&${languageQuery}&${voteAverageQuery}`);
  const data = await response.json();
  return data.results;
};

const searchForRecommendations = async () => {
  const searchInput = document.getElementById("search").value;
  const movies = searchInput.split(",").map(movie => movie.trim());

  if (movies.length === 0) {
    alert("Please enter at least one movie.");
    return;
  }

  // Initialize an array to store movie recommendations
  let movieRecommendations = [];

  // Initialize sets to store movie IDs and genre IDs from search bar
  const searchMovieIds = new Set();
  const searchGenreIds = new Set();

  // Iterate through the user's input movies
  for (const movie of movies) {
    const movieData = await searchForMovie(movie);
    if (movieData) {
      const genreIds = movieData.genre_ids;
      const originalLanguage = movieData.original_language;

      // Add the movie's ID and genre IDs to the respective sets
      searchMovieIds.add(movieData.id);
      genreIds.forEach(id => searchGenreIds.add(id));

      // Get movie recommendations based on genre and language
      const recommendations = await getMovieRecommendations(genreIds, originalLanguage);

      // Filter out movies entered in the search bar from recommendations using ID
      const filteredRecommendations = recommendations.filter(movie => !searchMovieIds.has(movie.id));

      // Sort the filtered recommendations by vote_average (higher vote_average first)
      filteredRecommendations.sort((a, b) => b.vote_average - a.vote_average);

      // Take the top recommendations and add them to the movieRecommendations array
      movieRecommendations.push(...filteredRecommendations.slice(0, 4));
    }
  }

  // Check if genre_id 16 or 878 is in the searchGenreIds set
  const shouldIncludeGenre16 = searchGenreIds.has(16);
  const shouldIncludeGenre878 = searchGenreIds.has(878);

  if (movieRecommendations.length >= 4) {
    // If at least 4 recommendations are found, use them as is
    displayRecommendations(movieRecommendations.slice(0, 4));
  } else {
    // If fewer than 4 recommendations are found, adjust the criteria to obtain additional recommendations

    if (shouldIncludeGenre16 && movieRecommendations.length < 4) {
      // If genre_id 16 is required and not enough recommendations are found, get more genre 16 movies
      const additionalRecommendations = await getMovieRecommendations([16], "en");
      additionalRecommendations.sort((a, b) => b.vote_average - a.vote_average);
      movieRecommendations = movieRecommendations.concat(additionalRecommendations.slice(0, 4 - movieRecommendations.length));
    } else if (movieRecommendations.length === 1) {
      // If only 1 recommendation is found, use genre_id of the first input movie and find 3 more
      const genreIdToSearch = Array.from(searchGenreIds)[0]; // Get the first genre_id
      const additionalRecommendations = await getMovieRecommendations([genreIdToSearch], "en");
      additionalRecommendations.sort((a, b) => b.vote_average - a.vote_average);
      movieRecommendations = movieRecommendations.concat(additionalRecommendations.slice(0, 3));
    } else if (movieRecommendations.length === 2) {
      // If only 2 recommendations are found, use genre_id of the first input movie and find 2 more
      const genreIdToSearch = Array.from(searchGenreIds)[0]; // Get the first genre_id
      const additionalRecommendations = await getMovieRecommendations([genreIdToSearch], "en");
      additionalRecommendations.sort((a, b) => b.vote_average - a.vote_average);
      movieRecommendations = movieRecommendations.concat(additionalRecommendations.slice(0, 2));
    } else if (movieRecommendations.length === 3) {
      // If only 3 recommendations are found, use genre_id of the first input movie and find 1 more
      const genreIdToSearch = Array.from(searchGenreIds)[0]; // Get the first genre_id
      const additionalRecommendations = await getMovieRecommendations([genreIdToSearch], "en");
      additionalRecommendations.sort((a, b) => b.vote_average - a.vote_average);
      movieRecommendations = movieRecommendations.concat(additionalRecommendations.slice(0, 1));
    } else if (movieRecommendations.length === 0) {
      // If no recommendations are found, use genre_id of the first input movie and find 4
      const genreIdToSearch = Array.from(searchGenreIds)[0]; // Get the first genre_id
      const additionalRecommendations = await getMovieRecommendations([genreIdToSearch], "en");
      additionalRecommendations.sort((a, b) => b.vote_average - a.vote_average);
      movieRecommendations = additionalRecommendations.slice(0, 4);
    }

    // Display the recommendations
    displayRecommendations(movieRecommendations);
  }
};


// Listen for click event on the search icon
document.querySelector(".icon").addEventListener("click", searchForRecommendations);

// Listen for form submission event (Enter key press) on the search input field
document.getElementById("form").addEventListener("submit", function (e) {
  e.preventDefault();
  searchForRecommendations();
});

// Function to display movie recommendations in your HTML
const displayRecommendations = recommendations => {
  const recommendationsContainer = document.querySelector(".recommendations");

  recommendationsContainer.innerHTML = ""; // Clear previous recommendations

  recommendations.forEach(movie => {
      const movieElement = document.createElement("div");
      movieElement.classList.add("movie");

      // Assign a class based on the vote_average value
      let voteClass = "green";
      if (movie.vote_average >= 7.6) {
        voteClass = "green";
      } else if (movie.vote_average >= 6.2 && movie.vote_average < 7.6) {
        voteClass = "orange";
      } else if (movie.vote_average < 6.2){
        voteClass = "red";
      }

      // Replace these values in your existing movie card structure
      movieElement.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w185/${movie.poster_path}" alt="poster">
        <div class="movie-info">
          <h3>${movie.title}</h3>
          <span class="${voteClass}">${movie.vote_average}</span>
        </div>
        <div class="overview">
          <h3>Overview</h3>
          ${movie.overview}
        </div>
      `;

      recommendationsContainer.appendChild(movieElement);
  });
};
