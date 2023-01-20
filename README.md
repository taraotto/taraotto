# Jekyll + CloudCannon + Tailwind + Docker Dev Container Starter

## Dependencies

This boilerplate uses the following dependencies & plugins:

- [Jekyll](https://jekyllrb.com) (~>4.3.1)
- [TailwindCSS](https://tailwindcss.com) (^3.2.4)

Detailed dependencies are listed in the [Gemfile](./Gemfile) and [package.json](./package.json)
  
## Local project development

### Local dependencies

- [Visual Studio Code](https://code.visualstudio.com)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
-  Visual Studio Code [Docker Extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker)
- Visual Studio Code [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Run Jekyll and Tailwind in a dev container

1. Open Docker Desktop

2. Open this folder in a Dev Container within VS Code

3. If this is the **first time** you're running Jekyll, in the terminal, run
    ```
    $ bundle install
    ```

4. Run **Jekyll & Tailwind CLI** concurrently:
    ```
    $ npm run dev
    ```

### Troubleshooting

- #### **Jekyll changes not detected or displayed**
    Run Jekyll & Tailwind CLI concurrently with polling:
    ```
    $ npm run dev:poll
    ```
- #### **Debug a Jekyll error**
    Run the debug command:
    ```
    $ npm run dev:trace
    ```
- #### **Jekyll error message related to rexml**
    Run the bundler install command:
    ```
    $ bundle install
    ```
- #### **Error message related to bundler or ruby**
    Ensure your project is open in a dev container.
- #### **Something else is wrong**
    First, ensure your project is open in a dev container and look for error messages related to your code. 
    
    Next, quit any running processes by killing your terminals and then re-run the command. Try restarting VS Code and re-run the command. Try restarting your computer and re-run the command.

    Finally, try clearing your Jekyll cache and rebuilding packages. You may also want to delete your `node_modules` folder before running these commands.
    ```
    $ jekyll clean
    $ bundle install
    $ npm install
    ```