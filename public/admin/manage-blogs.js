    // Preview selected image
    document.getElementById('imageFile').addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const preview = document.getElementById('preview');
          preview.src = e.target.result;
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('blogForm').addEventListener('submit', async function (e) {
      e.preventDefault(); // Prevent page reload

      const formData = new FormData(this);
      const title = formData.get('title');
      const content = formData.get('content');
      let imageUrl = formData.get('imageUrl');

      const fileInput = document.getElementById('imageFile');
      const file = fileInput.files[0];

      if (file) {
        const reader = new FileReader();
        reader.onloadend = async function () {
          imageUrl = reader.result;
          await postBlog({ title, content, imageUrl });
        };
        reader.readAsDataURL(file);
      } else {
        await postBlog({ title, content, imageUrl });
      }
    });

    async function postBlog(data) {
      try {
        const res = await fetch('/api/blogs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          alert('✅ Blog posted!');
          document.getElementById('blogForm').reset();
          document.getElementById('preview').style.display = 'none';
          loadBlogs();
        } else {
          alert('❌ Failed to post blog.');
        }
      } catch (err) {
        console.error(err);
        alert('❌ Error posting blog.');
      }
    }

    async function loadBlogs() {
      try {
        const res = await fetch('/api/blogs');
        const blogs = await res.json();

        const container = document.getElementById('blogList');
        container.innerHTML = '';

        blogs.forEach(blog => {
          container.innerHTML += `
            <div class="blog-item">
              <h3>${blog.title}</h3>
              <p><em>${new Date(blog.createdAt).toLocaleDateString()}</em></p>
              ${blog.imageUrl ? `<img src="${blog.imageUrl}" alt="Blog Image"/>` : ''}
              <p>${blog.content}</p>
              <button onclick="deleteBlog('${blog._id}')">Delete</button>
            </div>
          `;
        });
      } catch (error) {
        console.error('Failed to load blogs:', error);
      }
    }

    async function deleteBlog(id) {
      try {
        await fetch('/api/blogs/' + id, {
          method: 'DELETE'
        });
        alert('🗑️ Blog deleted!');
        loadBlogs();
      } catch (error) {
        alert('Failed to delete blog.');
      }
    }

    // Initial load
    loadBlogs();
