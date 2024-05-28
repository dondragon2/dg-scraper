# README

## Install pnpm and Run Node Project

### Introduction

This README file will guide you through the process of installing `pnpm` on Windows and macOS, and running a Node.js project using `pnpm`.

### Prerequisites

- Node.js installed on your machine. You can download it from [Node.js official website](https://nodejs.org/).

### Installing pnpm

https://pnpm.io/installation

OR

   ```sh
    npm i -g pnpm
   ```

### Running a Node.js Project

1. Clone your Node.js project repository or navigate to your project directory:

   ```sh
   git clone https://github.com/dondragon2/dg-scraper.git
   cd dg-scraper
   ```

2. Install the project dependencies using `pnpm`:

   ```sh
   pnpm install
   ```

3. Configure the project:

   - Create a `.env` file in the root directory of the project.
   - Add the following environment variables to the `.env` file:

     ```sh
      BASE_URL=https://gels-avoirs.dgtresor.gouv.fr/List
      OUTPUT_FILE_PATH=./output.csv
     ```
     * The `BASE_URL` variable should contain the URL of the website you want to scrape.
     * The `OUTPUT_FILE_PATH` variable should contain the path to the output file where the scraped data will be saved.

3. Run the project:

   ```sh
   pnpm start
   ```
