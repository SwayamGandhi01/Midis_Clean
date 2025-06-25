  async function loadBlogs() {
      try {
        const res = await fetch('/api/blogs');
        const blogs = await res.json();

        const container = document.getElementById('blogContainer');
        container.innerHTML = '';

        blogs.forEach((blog, index) => {
          const title = blog.title || 'Untitled Blog';
          const content = blog.content || '';
          const imageUrl = blog.imageUrl || '/images/fallback.jpg';
          const formattedContent = content.length > 300 ? content.slice(0, 300) + '...' : content;

          const blogBox = document.createElement('div');
          blogBox.classList.add('blog-box', 'fade-in');

          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = title;
          img.addEventListener('error', () => {
            img.src = '/images/fallback.jpg';
          });

          const textDiv = document.createElement('div');
          textDiv.classList.add('blog-text');

          const h2 = document.createElement('h2');
          h2.textContent = title;

          const p = document.createElement('p');
          p.textContent = formattedContent;

          const date = document.createElement('p');
          date.innerHTML = `<em>${new Date(blog.createdAt).toLocaleDateString()}</em>`;

          const a = document.createElement('a');
          a.href = '#';
          a.textContent = 'Read Full Guide →';
          a.addEventListener('click', (e) => {
            e.preventDefault();
            p.textContent = blog.content;
            a.style.display = 'none';
          });

          textDiv.appendChild(h2);
          textDiv.appendChild(p);
          textDiv.appendChild(date);
          if (content.length > 300) textDiv.appendChild(a);

          blogBox.appendChild(img);
          blogBox.appendChild(textDiv);

          container.appendChild(blogBox);
        });
      } catch (error) {
        console.error('Failed to load blogs:', error);
        document.getElementById('blogContainer').innerHTML =
          '<p style="text-align:center;color:red;">Failed to load blogs.</p>';
      }
    }

    document.addEventListener('DOMContentLoaded', loadBlogs);