FROM kasmweb/nginx

RUN wget https://kasm-static-content.s3.amazonaws.com/kasm_release_1.13.1.421524.tar.gz \
&& tar -xf kasm_release_1.13.1.421524.tar.gz \
&& cp kasm_release/conf/nginx/* /etc/nginx/conf.d -r \
&& sed -i 's/server kasm_/server kasm-/g' /etc/nginx/conf.d/upstream_* \
&& cp kasm_release/www /srv -r \
&& rm kasm_release_1.13.1.421524.tar.gz kasm_release -r

COPY kasm_nginx.crt /etc/ssl/certs
COPY kasm_nginx.key /etc/ssl/private
